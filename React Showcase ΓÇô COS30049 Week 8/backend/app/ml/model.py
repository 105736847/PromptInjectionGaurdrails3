"""
model.py – load the trained model ONCE and use it for every request.

Reading a model from disk (or, worse, training one) is thousands of times
slower than a single prediction. So the API loads it one time when the server
starts (the `lifespan` in routers/ml.py) and keeps it in memory; each request
only runs feature extraction + predict_proba, which takes about a millisecond.

    model = load_model()                        # cached: the 2nd call returns the same object
    model.predict("http://203.0.113.9/login")   # → probability, label, explanation, latency
"""
import json
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn

from .features import FEATURE_DESCRIPTIONS, FEATURE_LABELS, FEATURE_NAMES, extract_features, features_matrix
from .train import ARTIFACTS_DIR, build_pipeline, pipeline_config, train_and_save

SUSPICIOUS, SAFE = "suspicious", "safe"


class UrlModel:
    """The fitted pipeline + its metadata + test metrics, ready to serve."""

    def __init__(self, bundle: dict, metrics: dict, *, load_seconds: float, trained_on_load: bool):
        self.pipeline = bundle["pipeline"]
        self.version: str = bundle["model_version"]
        self.trained_at: str = bundle["trained_at"]
        self.data_source: str = bundle["data_source"]
        self.training_rows: int = bundle["training_rows"]
        self.metrics = metrics
        self.loaded_at = datetime.now(timezone.utc)
        self.load_seconds = load_seconds
        self.trained_on_load = trained_on_load
        # FastAPI runs `def` endpoints in several threads at once – protect the shared counter.
        self._count_lock = threading.Lock()
        self.predictions_served = 0

        # Pull the steps out once so every explanation can reuse them.
        self._clip = self.pipeline.named_steps["clip"]
        self._scaler = self.pipeline.named_steps["scaler"]
        self._clf = self.pipeline.named_steps["clf"]
        self.intercept = float(self._clf.intercept_[0])

    @classmethod
    def from_artifacts(cls, folder: Path = ARTIFACTS_DIR) -> "UrlModel":
        """Load model.joblib + metrics.json, training them first if they are missing or out of date."""
        started = time.perf_counter()
        model_path, metrics_path = Path(folder) / "model.joblib", Path(folder) / "metrics.json"
        bundle = None
        if model_path.exists() and metrics_path.exists():
            metrics = json.loads(metrics_path.read_text())
            # SECURITY: joblib/pickle files can run code while loading – only ever load files you made.
            bundle = joblib.load(model_path)
            reason = stale_reason(bundle, metrics)
            if reason:  # serving it could give wrong answers – retrain instead
                print(f"app.ml: retraining the model because {reason}.")
                bundle = None
        trained = bundle is None
        if trained:
            bundle, metrics = train_and_save(out_dir=Path(folder))  # fast: well under a second on the toy data
        return cls(bundle, metrics, load_seconds=round(time.perf_counter() - started, 4), trained_on_load=trained)

    def warm_up(self) -> None:
        """One throw-away prediction: the first call pays one-off set-up costs inside
        NumPy/scikit-learn, so pay them at start-up instead of in the first user's request."""
        x = features_matrix(["https://warm-up.example/"])
        self.pipeline.predict_proba(x)  # called directly, so it is not counted as a real prediction
        self.pipeline[:-1].transform(x)  # every step before the classifier (used by the explanation)

    def _count(self, n: int) -> None:
        with self._count_lock:
            self.predictions_served += n

    def predict(self, url: str, threshold: float = 0.5) -> dict:
        """One URL → probability, label and a feature-by-feature explanation."""
        started = time.perf_counter()
        values = extract_features(url)
        x = np.array([list(values.values())])  # a 1-row matrix: scikit-learn always predicts on 2-D input
        probability = float(self.pipeline.predict_proba(x)[0, 1])  # column 1 = P(suspicious)

        # Explanation for a linear model: log-odds = intercept + Σ weight × scaled value.
        # Each term is that feature's contribution; the sigmoid of the total is the probability.
        used = self._clip.transform(x)  # the same steps as inside predict_proba: clip, then scale
        scaled = self._scaler.transform(used)[0]
        weights = self._clf.coef_[0]
        contributions = [
            {
                "feature": name,
                "label": FEATURE_LABELS[name],
                "description": FEATURE_DESCRIPTIONS[name],
                "value": values[name],
                # Outside the training range? Then the model used the nearest value it has seen.
                "clipped_to": None if u == values[name] else round(float(u), 4),
                "scaled": round(float(z), 4),
                "weight": round(float(w), 4),
                "contribution": round(float(w * z), 4),
            }
            for name, u, z, w in zip(FEATURE_NAMES, used[0], scaled, weights)
        ]
        logit = self.intercept + float(np.dot(weights, scaled))
        self._count(1)
        return {
            "url": url,
            "probability": round(probability, 6),
            "label": SUSPICIOUS if probability >= threshold else SAFE,
            "threshold": threshold,
            "intercept": round(self.intercept, 4),
            "logit": round(logit, 4),
            "contributions": contributions,
            "latency_ms": round((time.perf_counter() - started) * 1000, 3),
            "model_version": self.version,
        }

    def predict_many(self, urls: list[str], threshold: float = 0.5) -> list[dict]:
        """Many URLs in ONE predict_proba call – much faster than calling predict() in a loop."""
        if not urls:
            return []
        probabilities = self.pipeline.predict_proba(features_matrix(urls))[:, 1]
        self._count(len(urls))
        return [
            {"probability": round(float(p), 6), "label": SUSPICIOUS if p >= threshold else SAFE}
            for p in probabilities
        ]


def stale_reason(bundle: dict, metrics: dict) -> str | None:
    """Why a saved artifact must NOT be served (None = it is fine to load)."""
    if bundle.get("feature_names") != FEATURE_NAMES:
        return "features.py changed"
    if bundle.get("pipeline_config") != pipeline_config(build_pipeline()):
        return "build_pipeline() in train.py changed"
    if bundle.get("sklearn_version") != sklearn.__version__:
        return f"it was saved with scikit-learn {bundle.get('sklearn_version')}, this is {sklearn.__version__}"
    if metrics.get("model_version") != bundle.get("model_version"):
        return "model.joblib and metrics.json belong to different models"
    return None


_model: UrlModel | None = None
_lock = threading.Lock()


def load_model() -> UrlModel:
    """Load the model the first time; afterwards return the SAME object (a simple cache)."""
    global _model
    with _lock:  # two threads arriving at once must not both load (or train) it
        if _model is None:
            _model = UrlModel.from_artifacts(ARTIFACTS_DIR)
        return _model


def get_model() -> UrlModel:
    """FastAPI dependency: `def endpoint(model: ModelDep)`. Tests can override it."""
    return _model or load_model()
