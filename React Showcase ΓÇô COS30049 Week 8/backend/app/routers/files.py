"""
files.py – file uploads, downloads and "analyse a CSV on the server".

    POST   /api/files               upload one or more files (multipart/form-data)
    GET    /api/files               list the uploaded files, newest first
    GET    /api/files/{id}          download a file (?inline=true shows it in the browser)
    DELETE /api/files/{id}          delete a file
    POST   /api/files/csv-summary   parse a CSV → rows, columns, statistics + histogram bins

Four rules for accepting uploads safely – every one of them matters in a real app:
  1. Never trust the FILE NAME. "../../app/main.py" is a valid file name! We store the bytes
     under a random uuid name and keep the original name only as data in the database.
  2. Never trust the CONTENT-TYPE the browser sends – anyone can fake it. We check the file
     extension against an allow-list AND look at the first bytes ("magic numbers").
  3. Limit the SIZE – and know WHEN each check runs. FastAPI reads the whole multipart body
     (spooling every file to a temp file, on disk above 1 MB) BEFORE your endpoint runs. So
     the 5 MB check in copy_limited() only keeps big files out of upload_dir – the bytes have
     already arrived. SizeCheckedRoute refuses a too-big Content-Length before the body is
     read at all. In production the reverse proxy should cap every request as well
     (nginx: client_max_body_size) – it also stops requests that send no Content-Length.
  4. Never serve uploads from a folder that runs code, and send them back with
     "X-Content-Type-Options: nosniff" so the browser doesn't guess a more dangerous type.

Who may upload? Here: anyone – it is a demo, so we cap the number of stored files instead.
A real app adds `user: CurrentUser` to these endpoints (see the Login & JWT page) and stores
an owner_id with every file, so people can only list and delete their own.

Docs: https://fastapi.tiangolo.com/tutorial/request-files/
"""
import csv
import io
import itertools
import math
import statistics
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, BinaryIO, Literal

from fastapi import APIRouter, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.routing import APIRoute
from pydantic import BaseModel
from sqlmodel import Field, SQLModel, func, select

from ..config import settings
from ..database import SessionDep

MAX_BYTES = 5 * 1024 * 1024  # 5 MB per file
MAX_FILES = 10  # per request
MAX_REQUEST_BYTES = MAX_FILES * MAX_BYTES + 64 * 1024  # ten full files + the form's own bytes
MAX_STORED_FILES = 100  # a demo server must not let a runaway script fill its disk
CHUNK_BYTES = 256 * 1024  # copy 256 KB at a time – never the whole file in memory


class SizeCheckedRoute(APIRoute):
    """Answers 413 when the Content-Length header is too big – BEFORE FastAPI reads the body.

    A check inside the endpoint comes too late to save bandwidth and temp space (rule 3).
    A custom route class runs first. Requests without Content-Length ("chunked") get past it,
    which is why production servers also set a limit in the proxy."""

    def get_route_handler(self):
        read_body_then_call_endpoint = super().get_route_handler()

        async def check_size_first(request: Request) -> Response:
            declared = request.headers.get("content-length", "")
            if declared.isdigit() and int(declared) > MAX_REQUEST_BYTES:
                raise HTTPException(
                    status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"The request is larger than {MAX_REQUEST_BYTES // (1024 * 1024)} MB – refused before reading it.",
                )
            return await read_body_then_call_endpoint(request)

        return check_size_first


router = APIRouter(prefix="/api/files", tags=["files"], route_class=SizeCheckedRoute)

# extension → (content type we send back, the bytes a genuine file starts with)
ALLOWED_TYPES: dict[str, tuple[str, bytes | None]] = {
    ".csv": ("text/csv", None),
    ".txt": ("text/plain", None),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
    ".pdf": ("application/pdf", b"%PDF-"),
}
ALLOWED_TEXT = "CSV, TXT, PNG, JPG and PDF"


# ---------- database table + response models ----------------------------------
class StoredFile(SQLModel, table=True):
    """One row per uploaded file. The bytes live on disk in settings.upload_dir."""

    __tablename__ = "uploaded_files"

    id: int | None = Field(default=None, primary_key=True)
    original_name: str  # what the user called it – only ever displayed, never used as a path
    stored_name: str = Field(unique=True)  # "<uuid>.png" – the name on disk
    content_type: str
    size: int
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FileInfo(BaseModel):
    id: int
    name: str
    content_type: str
    size: int
    uploaded_at: datetime
    url: str  # where the front end can download it


def to_info(row: StoredFile) -> FileInfo:
    # SQLite forgets time zones, so say explicitly that the time is UTC ("…Z" in JSON).
    uploaded = row.uploaded_at if row.uploaded_at.tzinfo else row.uploaded_at.replace(tzinfo=timezone.utc)
    return FileInfo(
        id=row.id,
        name=row.original_name,
        content_type=row.content_type,
        size=row.size,
        uploaded_at=uploaded,
        url=f"/api/files/{row.id}",
    )


# ---------- helpers ------------------------------------------------------------
def clean_name(filename: str | None) -> str:
    """Keep only the last part of the name ("C:\\x\\..\\a.csv" → "a.csv") for display.
    Long names are cut to 120 characters in the STEM, so the extension check_type() needs survives."""
    name = Path((filename or "").replace("\\", "/")).name.strip()
    stem, suffix = Path(name).stem, Path(name).suffix[:10]
    return (stem[: 120 - len(suffix)] + suffix) or "unnamed"


def check_type(filename: str) -> tuple[str, str]:
    """Return (extension, content type) or answer 415 Unsupported Media Type."""
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"“{filename}” is not allowed – only {ALLOWED_TEXT} files are accepted.",
        )
    return extension, ALLOWED_TYPES[extension][0]


def copy_limited(source: BinaryIO, target: Path, extension: str, filename: str) -> int:
    """Copy an upload (already received and spooled by Starlette) into upload_dir, chunk by
    chunk. Returns the size; raises 413/415/422."""
    magic = ALLOWED_TYPES[extension][1]
    size = 0
    with target.open("wb") as out:
        while chunk := source.read(CHUNK_BYTES):
            if size == 0:  # first chunk: does the content match the extension?
                looks_wrong = not chunk.startswith(magic) if magic else b"\x00" in chunk[:4096]
                if looks_wrong:
                    raise HTTPException(
                        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                        detail=f"“{filename}” does not look like a real {extension} file.",
                    )
            size += len(chunk)
            if size > MAX_BYTES:  # stop copying and don't keep it (the upload itself has already arrived)
                raise HTTPException(
                    status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"“{filename}” is larger than the {MAX_BYTES // (1024 * 1024)} MB limit.",
                )
            out.write(chunk)
    if size == 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"“{filename}” is empty.")
    return size


def get_row(session: SessionDep, file_id: int) -> StoredFile:
    row = session.get(StoredFile, file_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"File {file_id} was not found.")
    return row


# ---------- endpoints ------------------------------------------------------------
# Plain `def` (not async): copying files and using the database are *blocking* work.
# FastAPI runs a `def` endpoint in a worker thread, so other requests are not held up.
@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=list[FileInfo],
    summary="Upload one or more files",
    responses={
        413: {"description": "A file is larger than 5 MB (or more than 10 files were sent)"},
        415: {"description": "A file type that is not on the allow-list"},
        507: {"description": f"The server already stores {MAX_STORED_FILES} files"},
    },
)
def upload_files(
    files: Annotated[list[UploadFile], File(description=f"One or more {ALLOWED_TEXT} files, max 5 MB each")],
    session: SessionDep,
) -> list[FileInfo]:
    """Saves every file under a random name. All-or-nothing: if one file is rejected, none are kept."""
    if len(files) > MAX_FILES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, detail=f"Send at most {MAX_FILES} files at once.")
    stored = session.exec(select(func.count()).select_from(StoredFile)).one()
    if stored + len(files) > MAX_STORED_FILES:
        raise HTTPException(
            status.HTTP_507_INSUFFICIENT_STORAGE,
            detail=f"The server keeps at most {MAX_STORED_FILES} files – delete some first.",
        )

    upload_dir = settings.upload_dir  # read at request time (tests point it at a temp folder)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Check every type before writing anything, so a bad file 3 doesn't leave files 1–2 behind.
    checked = [(upload, clean_name(upload.filename)) for upload in files]
    types = [check_type(name) for _, name in checked]

    rows: list[StoredFile] = []
    written: list[Path] = []
    try:
        for (upload, name), (extension, content_type) in zip(checked, types):
            stored_name = f"{uuid.uuid4().hex}{extension}"  # safe: we chose every character
            target = upload_dir / stored_name
            written.append(target)
            size = copy_limited(upload.file, target, extension, name)
            rows.append(StoredFile(original_name=name, stored_name=stored_name, content_type=content_type, size=size))
    except Exception:  # 413/415/422 – or the disk is full: remove what we already wrote
        for path in written:
            path.unlink(missing_ok=True)
        raise

    session.add_all(rows)
    session.commit()
    for row in rows:
        session.refresh(row)  # load the ids the database generated
    return [to_info(row) for row in rows]


@router.get("", response_model=list[FileInfo], summary="List uploaded files (newest first)")
def list_files(session: SessionDep, limit: Annotated[int, Query(ge=1, le=MAX_STORED_FILES)] = 50) -> list[FileInfo]:
    rows = session.exec(select(StoredFile).order_by(StoredFile.id.desc()).limit(limit)).all()
    return [to_info(row) for row in rows]


@router.get(
    "/{file_id}",
    response_class=FileResponse,
    summary="Download a file",
    responses={
        200: {"description": "The file itself", "content": {"application/octet-stream": {}}},
        404: {"description": "No such file"},
    },
)
def download_file(
    file_id: int,
    session: SessionDep,
    inline: Annotated[bool, Query(description="true = show in the browser (images, PDFs) instead of downloading")] = False,
) -> FileResponse:
    row = get_row(session, file_id)
    path = settings.upload_dir / row.stored_name
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"File {file_id} is missing on the server.")
    # Browsers download text/csv even when told "inline" – so show a CSV as plain text instead.
    media_type = "text/plain" if inline and row.content_type == "text/csv" else row.content_type
    # FileResponse streams the file from disk and sets Content-Length / Last-Modified for us.
    # `filename` adds "Content-Disposition" so the browser saves it under the ORIGINAL name.
    return FileResponse(
        path,
        media_type=media_type,
        filename=row.original_name,
        content_disposition_type="inline" if inline else "attachment",
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file",
    responses={404: {"description": "No such file"}},
)
def delete_file(file_id: int, session: SessionDep) -> None:
    row = get_row(session, file_id)
    (settings.upload_dir / row.stored_name).unlink(missing_ok=True)
    session.delete(row)
    session.commit()


# ---------- CSV summary ----------------------------------------------------------
# Limit what we SEND BACK as well as what we accept: every column becomes a summary with its
# own histogram, so a tiny file with 100,000 columns would produce a response of many MB.
MAX_COLUMNS = 50
MAX_ROWS = 100_000  # analyse at most this many data rows – and say so (`truncated`)
LARGEST_NUMBER = 1e300  # beyond this, adding the values up would overflow to infinity


class HistogramBin(BaseModel):
    x0: float  # bin start (inclusive)
    x1: float  # bin end
    count: int


class TopValue(BaseModel):
    value: str
    count: int


class ColumnSummary(BaseModel):
    name: str
    kind: Literal["numeric", "text"]
    count: int  # non-empty values
    missing: int
    unique: int
    # numeric columns only
    mean: float | None = None
    std: float | None = None
    min: float | None = None
    median: float | None = None
    max: float | None = None
    histogram: list[HistogramBin] | None = None
    # text columns only
    top: list[TopValue] | None = None


class CsvSummary(BaseModel):
    filename: str
    rows: int  # data rows analysed
    truncated: bool = False  # True = the file had more than MAX_ROWS rows; only the first ones were used
    columns: list[ColumnSummary]
    preview: list[dict[str, str]]  # the first 5 rows, so the user can check the parse


def to_number(text: str) -> float | None:
    try:
        value = float(text)
    except ValueError:
        return None
    # "nan", "inf" and absurdly huge values (their sum overflows) are not useful numbers.
    return value if math.isfinite(value) and abs(value) <= LARGEST_NUMBER else None


def make_histogram(values: list[float], bins: int) -> list[HistogramBin]:
    """Equal-width bins from min to max – the same thing d3.bin() or numpy.histogram() do."""
    low, high = min(values), max(values)
    if low == high:
        return [HistogramBin(x0=low, x1=high, count=len(values))]
    span = high - low
    counts = [0] * bins
    for value in values:
        index = min(int((value - low) / span * bins), bins - 1)  # the maximum belongs in the last bin
        counts[index] += 1
    edges = [low + span * i / bins for i in range(bins + 1)]
    return [
        HistogramBin(x0=round(edges[i], 6), x1=round(edges[i + 1], 6), count=count)
        for i, count in enumerate(counts)
    ]


def summarise_column(name: str, raw: list[str], bins: int) -> ColumnSummary:
    present = [value for value in raw if value != ""]
    base = {"name": name, "count": len(present), "missing": len(raw) - len(present), "unique": len(set(present))}
    numbers = [to_number(value) for value in present]
    if present and all(number is not None for number in numbers):
        return ColumnSummary(
            **base,
            kind="numeric",
            mean=round(statistics.fmean(numbers), 4),
            std=round(statistics.stdev(numbers), 4) if len(numbers) > 1 else 0.0,
            min=min(numbers),
            median=statistics.median(numbers),
            max=max(numbers),
            histogram=make_histogram(numbers, bins),
        )
    top = [TopValue(value=value, count=count) for value, count in Counter(present).most_common(5)]
    return ColumnSummary(**base, kind="text", top=top)


def read_csv(text: str) -> tuple[list[str], list[list[str]], bool]:
    """→ (header, data rows, truncated?). Blank lines are skipped."""
    # newline="" lets the csv module handle every line ending: \n, \r\n and old Mac-style \r.
    rows = (row for row in csv.reader(io.StringIO(text, newline="")) if any(cell.strip() for cell in row))
    try:
        header = next(rows, [])
        if len(header) > MAX_COLUMNS:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"This demo analyses at most {MAX_COLUMNS} columns – the file has {len(header)}.",
            )
        body = list(itertools.islice(rows, MAX_ROWS + 1))  # one row too many tells us "there is more"
    except csv.Error as exc:  # e.g. a single cell bigger than 128 KB
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"Could not read the CSV: {exc}.") from None
    return header, body[:MAX_ROWS], len(body) > MAX_ROWS


@router.post(
    "/csv-summary",
    response_model=CsvSummary,
    summary="Analyse a CSV file",
    responses={
        413: {"description": "File larger than 5 MB"},
        415: {"description": "Not a .csv file"},
        422: {"description": f"Not UTF-8, unreadable, no data rows, or more than {MAX_COLUMNS} columns"},
    },
)
def csv_summary(
    file: Annotated[UploadFile, File(description="A UTF-8 .csv file with a header row")],
    bins: Annotated[int, Query(ge=2, le=30, description="Number of histogram bins per numeric column")] = 10,
) -> CsvSummary:
    """Parses the CSV with Python's built-in csv module. The file is analysed, not stored."""
    name = clean_name(file.filename)
    if Path(name).suffix.lower() != ".csv":
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"“{name}” is not a .csv file.")

    data = file.file.read(MAX_BYTES + 1)  # read one byte too many to detect "too big"
    if len(data) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, detail=f"“{name}” is larger than 5 MB.")
    try:
        text = data.decode("utf-8-sig")  # "-sig" removes the invisible BOM that Excel adds
    except UnicodeDecodeError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The file is not UTF-8 text.")

    header_row, body, truncated = read_csv(text)
    if not body:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The CSV needs a header row and at least one data row."
        )

    header = [cell.strip() or f"column_{i + 1}" for i, cell in enumerate(header_row)]
    # Short rows count as missing values; extra cells beyond the header are ignored.
    columns = [[row[i].strip() if i < len(row) else "" for row in body] for i in range(len(header))]

    return CsvSummary(
        filename=name,
        rows=len(body),
        truncated=truncated,
        columns=[summarise_column(col_name, values, bins) for col_name, values in zip(header, columns)],
        preview=[dict(zip(header, (col[r] for col in columns))) for r in range(min(5, len(body)))],
    )
