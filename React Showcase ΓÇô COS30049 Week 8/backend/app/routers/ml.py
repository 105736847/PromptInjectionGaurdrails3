"""
ml.py – serve the scikit-learn model over HTTP (prefix /api/ml).

    GET  /api/ml/info            which model is loaded: version, features, limits
    GET  /api/ml/metrics         test-set metrics saved by train.py (no retraining!)
    GET  /api/ml/examples        example URLs for the buttons on the React page
    POST /api/ml/predict         {"url": "...", "threshold": 0.5} → probability + explanation
    POST /api/ml/predict/batch   upload a CSV with a `url` column → one prediction per row

Two design decisions to notice:
  1. The model is loaded ONCE, in this router's `lifespan`, before the first request.
  2. Every endpoint is a plain `def`, not `async def`: scikit-learn is blocking, CPU-bound
     code. FastAPI runs `def` endpoints in a thread pool, so a prediction never blocks
     the event loop that is accepting other requests.
"""
import csv
import io
import time
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_core import PydanticCustomError

from ..ml.dataset import parse_label
from ..ml.features import FEATURES
from ..ml.model import UrlModel, get_model, load_model

MAX_URL_LENGTH = 2048  # a common practical limit for URLs
MAX_UPLOAD_BYTES = 1_000_000  # 1 MB
MAX_BATCH_ROWS = 1000
DEFAULT_THRESHOLD = 0.5
# Browsers label .csv files differently (Windows often says "application/vnd.ms-excel").
CSV_CONTENT_TYPES = {"text/csv", "application/csv", "application/vnd.ms-excel", "text/plain", "application/octet-stream", ""}


@asynccontextmanager
async def lifespan(app):
    # Runs once when the server starts (see https://fastapi.tiangolo.com/advanced/events/).
    # Loading here means the first user never waits for it, and a broken model file
    # stops the server at start-up – loudly – instead of failing on some later request.
    load_model().warm_up()
    yield


router = APIRouter(prefix="/api/ml", tags=["ml"], lifespan=lifespan)

# Endpoints ask for the model with a dependency instead of importing a global,
# so tests can swap in another model with app.dependency_overrides.
ModelDep = Annotated[UrlModel, Depends(get_model)]

ThresholdField = Field(DEFAULT_THRESHOLD, ge=0.01, le=0.99, description="Probability at or above which a URL is labelled 'suspicious'.")
Label = Literal["suspicious", "safe"]


# ---------- request / response models (they also document /api/docs) ------------
class PredictRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "examples": [{"url": "http://203.0.113.45/brightwater-uni/verify-account", "threshold": 0.5}],
    })

    url: str = Field(max_length=MAX_URL_LENGTH, description="The URL to classify.")
    threshold: float = ThresholdField

    @field_validator("url")
    @classmethod
    def clean_url(cls, value: str) -> str:
        value = value.strip()
        # PydanticCustomError gives a clean message (a plain ValueError would add "Value error, ").
        if not value:
            raise PydanticCustomError("url_empty", "Please enter a URL.")
        if any(ch.isspace() for ch in value):
            raise PydanticCustomError("url_spaces", "A URL cannot contain spaces.")
        return value


class Contribution(BaseModel):
    feature: str
    label: str
    description: str
    value: float = Field(description="The raw feature value, e.g. 3 hyphens.")
    clipped_to: float | None = Field(None, description="Set when the raw value was outside the range seen in "
                                                       "training: the value the model used instead.")
    scaled: float = Field(description="The value after StandardScaler (how unusual it is).")
    weight: float = Field(description="The model's coefficient for this feature.")
    contribution: float = Field(description="weight × scaled – this feature's push on the log-odds.")


class Prediction(BaseModel):
    url: str
    probability: float = Field(description="P(suspicious), between 0 and 1.")
    label: Label
    threshold: float
    intercept: float = Field(description="Baseline log-odds before any feature is considered.")
    logit: float = Field(description="intercept + sum of contributions; sigmoid(logit) = probability.")
    contributions: list[Contribution]
    latency_ms: float = Field(description="Server time for features + prediction + explanation.")
    model_version: str


class BatchRow(BaseModel):
    row: int = Field(description="Line number in the CSV file (the header is line 1).")
    url: str
    probability: float
    label: Label
    actual: Label | None = Field(None, description="From the optional `label` column (1/suspicious or 0/safe).")


class SkippedRow(BaseModel):
    row: int
    reason: str


class BatchSummary(BaseModel):
    filename: str
    rows: int
    predicted: int
    skipped: int
    suspicious: int
    safe: int
    mean_probability: float
    accuracy: float | None = Field(None, description="Only when the CSV has a `label` column.")
    threshold: float
    latency_ms: float
    model_version: str


class BatchResult(BaseModel):
    summary: BatchSummary
    results: list[BatchRow]
    skipped: list[SkippedRow]


class FeatureInfo(BaseModel):
    name: str
    label: str
    description: str


class ModelInfo(BaseModel):
    model_version: str
    algorithm: str
    trained_at: str
    data_source: str
    training_rows: int
    sklearn_version: str
    loaded_at: str
    load_seconds: float
    trained_on_load: bool
    predictions_served: int
    features: list[FeatureInfo]
    test_metrics: dict[str, float]
    default_threshold: float
    max_url_length: int
    max_batch_rows: int
    max_upload_bytes: int


class CurvePoint(BaseModel):
    x: float
    y: float


class ConfusionMatrix(BaseModel):
    threshold: float
    tn: int
    fp: int
    fn: int
    tp: int


class ThresholdRow(ConfusionMatrix):
    precision: float
    recall: float
    f1: float
    accuracy: float
    fpr: float = Field(description="False-positive rate: fp / (fp + tn).")


class Coefficient(BaseModel):
    feature: str
    label: str
    weight: float


class CalibrationBin(BaseModel):
    bin: str
    mean_predicted: float
    fraction_positive: float
    count: int


class ScoreHistogram(BaseModel):
    edges: list[float]
    safe: list[int]
    suspicious: list[int]


class DatasetSizes(BaseModel):
    total: int
    train: int
    test: int
    positive_rate: float


class Metrics(BaseModel):
    model_version: str
    trained_at: str
    algorithm: str
    data_source: str
    sklearn_version: str
    training_seconds: float
    features: list[str]
    sizes: DatasetSizes
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    confusion_matrix: ConfusionMatrix = Field(description="Counts on the test set at threshold 0.5.")
    roc_curve: list[CurvePoint] = Field(description="x = false-positive rate, y = true-positive rate.")
    pr_curve: list[CurvePoint] = Field(description="x = recall, y = precision.")
    thresholds: list[ThresholdRow] = Field(description="Metrics for thresholds 0.01 … 0.99 – no retraining needed.")
    coefficients: list[Coefficient]
    intercept: float
    calibration: list[CalibrationBin]
    score_histogram: ScoreHistogram


class Example(BaseModel):
    url: str
    note: str
    expected: Label


# Every host below is fictional (.example/.test/.invalid, documentation IP ranges).
EXAMPLES = [
    Example(url="https://www.brightwater-uni.example/courses/cos30049", note="Course page", expected="safe"),
    Example(url="https://library.brightwater-uni.example/search?q=react+hooks", note="Library search", expected="safe"),
    Example(url="https://www.harbourcity-news.example/2026/events/open-day", note="News article", expected="safe"),
    Example(url="https://learn.brightwater-uni.example/login", note="A real login page", expected="safe"),
    Example(url="http://203.0.113.45/brightwater-uni/verify-account", note="IP address as host", expected="suspicious"),
    Example(url="http://brightwater-uni.example@198.51.100.7/signin", note="The '@' trick", expected="suspicious"),
    Example(url="http://brightwater-uni-support-verify.test/secure/login/x8f2k9?id=a8f3kq2z9x&n=48213",
            note="Look-alike host", expected="suspicious"),
    Example(url="http://x7kq9v2m4t.invalid/a8Fk2Lq0/confirm?s=9f3a7c1e2b&n=5521", note="Random characters",
            expected="suspicious"),
    Example(url="https://www.brlghtwater-uni.example/login", note="Typo-squatting (hard!)", expected="suspicious"),
]


# ---------- endpoints ------------------------------------------------------------
@router.get("/info", response_model=ModelInfo, summary="Which model is being served?")
def model_info(model: ModelDep) -> ModelInfo:
    """Version, features and limits of the model loaded at start-up."""
    m = model.metrics
    return ModelInfo(
        model_version=model.version,
        algorithm=m["algorithm"],
        trained_at=model.trained_at,
        data_source=model.data_source,
        training_rows=model.training_rows,
        sklearn_version=m["sklearn_version"],
        loaded_at=model.loaded_at.isoformat(timespec="seconds"),
        load_seconds=model.load_seconds,
        trained_on_load=model.trained_on_load,
        predictions_served=model.predictions_served,
        features=[FeatureInfo(name=n, label=label, description=d) for n, label, d in FEATURES],
        test_metrics={k: m[k] for k in ("accuracy", "precision", "recall", "f1", "roc_auc")},
        default_threshold=DEFAULT_THRESHOLD,
        max_url_length=MAX_URL_LENGTH,
        max_batch_rows=MAX_BATCH_ROWS,
        max_upload_bytes=MAX_UPLOAD_BYTES,
    )


@router.get("/metrics", response_model=Metrics, summary="Test-set metrics saved at training time")
def model_metrics(model: ModelDep) -> dict:
    """Accuracy, precision, recall, F1, ROC AUC, curves, a thresholds table and the coefficients.

    Computed ONCE by train.py on the held-out test split – this endpoint only returns the saved JSON.
    """
    return model.metrics


@router.get("/examples", response_model=list[Example], summary="Example URLs to try")
def examples() -> list[Example]:
    return EXAMPLES


@router.post("/predict", response_model=Prediction, summary="Classify one URL")
def predict(body: PredictRequest, model: ModelDep) -> Prediction:
    """Returns the probability (not just a label), the label for the given threshold and
    each feature's contribution to the decision. Invalid input → 422."""
    return Prediction(**model.predict(body.url, body.threshold))


def _read_csv_upload(file: UploadFile) -> list[tuple[int, list[str]]]:
    """Validate the upload step by step and return (line number, cells) for every record, header first."""
    filename = file.filename or ""
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if not filename.lower().endswith(".csv") or content_type not in CSV_CONTENT_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail=f"Please upload a .csv file (got '{filename or 'no name'}', {content_type or 'unknown type'}).")
    # Read at most 1 byte MORE than allowed: enough to know the file is too big, without
    # ever loading a huge upload into memory.
    raw = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE,
                            detail=f"The file is larger than {MAX_UPLOAD_BYTES // 1_000_000} MB.")
    try:
        text = raw.decode("utf-8-sig")  # utf-8-sig also removes the BOM that Excel adds
    except UnicodeDecodeError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="The file is not UTF-8 text – is it really a CSV?")
    # Check AFTER decoding: a file holding only a BOM (an empty sheet saved as "CSV UTF-8") is empty too.
    if not text.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="The file is empty.")
    records, previous_end = [], 0
    try:
        # strict=True: a broken quote raises an error instead of silently producing odd rows.
        reader = csv.reader(io.StringIO(text), strict=True)
        for cells in reader:
            # Count FILE LINES, not records: a quoted cell can span several lines. reader.line_num
            # is the line a record ends on, so this record starts on the line after the previous one.
            records.append((previous_end + 1, cells))
            previous_end = reader.line_num
    except csv.Error as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"The CSV could not be read: {error}.")
    return records


LABEL_NAMES = {1: "suspicious", 0: "safe"}  # parse_label() (shared with train.py) gives 1, 0 or None


@router.post(
    "/predict/batch",
    response_model=BatchResult,
    summary="Classify every URL in a CSV file",
    responses={
        400: {"description": "Empty file, not UTF-8 or not readable as CSV"},
        413: {"description": "File larger than 1 MB"},
        415: {"description": "Not a .csv file"},
        422: {"description": "No `url` column, more than 1,000 rows or no valid URLs"},
    },
)
def predict_batch(
    file: Annotated[UploadFile, File(description="A CSV file with a `url` column (and optionally `label`).")],
    model: ModelDep,
    threshold: Annotated[float, Form(ge=0.01, le=0.99)] = DEFAULT_THRESHOLD,
) -> BatchResult:
    """Upload a CSV (≤ 1 MB, ≤ 1,000 rows). Rows with an empty or invalid URL are skipped
    and reported; all other rows are predicted in ONE vectorised call."""
    started = time.perf_counter()
    records = _read_csv_upload(file)
    header = [cell.strip().lower() for cell in records[0][1]]
    if "url" not in header:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT,
                            detail=f"The CSV needs a 'url' column. Found: {', '.join(h for h in header if h) or 'nothing'}.")
    url_col = header.index("url")
    label_col = header.index("label") if "label" in header else None

    data = [(line, row) for line, row in records[1:] if any(cell.strip() for cell in row)]
    if len(data) > MAX_BATCH_ROWS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT,
                            detail=f"Too many rows: {len(data):,} (the limit is {MAX_BATCH_ROWS:,}).")

    valid: list[tuple[int, str, str | None]] = []
    skipped: list[SkippedRow] = []
    for line, row in data:
        url = row[url_col].strip() if url_col < len(row) else ""
        if not url:
            skipped.append(SkippedRow(row=line, reason="The url cell is empty."))
        elif len(url) > MAX_URL_LENGTH:
            skipped.append(SkippedRow(row=line, reason=f"Longer than {MAX_URL_LENGTH} characters."))
        elif any(ch.isspace() for ch in url):
            skipped.append(SkippedRow(row=line, reason="A URL cannot contain spaces."))
        else:
            has_label = label_col is not None and label_col < len(row)
            actual = LABEL_NAMES.get(parse_label(row[label_col])) if has_label else None
            valid.append((line, url, actual))
    if not valid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail="No valid URLs found in the file.")

    predictions = model.predict_many([url for _, url, _ in valid], threshold)
    results = [
        BatchRow(row=line, url=url, actual=actual, **prediction)
        for (line, url, actual), prediction in zip(valid, predictions)
    ]
    labelled = [r for r in results if r.actual is not None]
    suspicious = sum(r.label == "suspicious" for r in results)
    summary = BatchSummary(
        filename=file.filename or "upload.csv",
        rows=len(data),
        predicted=len(results),
        skipped=len(skipped),
        suspicious=suspicious,
        safe=len(results) - suspicious,
        mean_probability=round(sum(r.probability for r in results) / len(results), 4),
        accuracy=round(sum(r.label == r.actual for r in labelled) / len(labelled), 4) if labelled else None,
        threshold=threshold,
        latency_ms=round((time.perf_counter() - started) * 1000, 3),
        model_version=model.version,
    )
    return BatchResult(summary=summary, results=results, skipped=skipped)
