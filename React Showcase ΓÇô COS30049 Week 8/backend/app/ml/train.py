"""
train.py – OFFLINE training. Run it once, not on every request:

    cd backend
    python -m app.ml.train                        # the synthetic toy dataset
    python -m app.ml.train --csv my_urls.csv      # your own data: columns url,label (1/suspicious or 0/safe)

It writes two files that the API loads when it starts:

    app/ml/artifacts/model.joblib   the fitted scikit-learn Pipeline + metadata (version, features…)
    app/ml/artifacts/metrics.json   test-set metrics, curves and a thresholds table for the React page

Everything the front end shows about model quality is computed HERE, once, on
data the model never saw during training (the test split) – the API only
reads the saved JSON. Never retrain inside a request handler.
"""
import argparse
import csv
import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .dataset import load_csv, make_dataset, require_both_classes
from .features import FEATURE_LABELS, FEATURE_NAMES, ClipToTrainingRange, features_matrix

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


def build_pipeline() -> Pipeline:
    """Clipping + scaling + a linear model, saved together so serving can never forget a step."""
    return Pipeline([
        # Inputs outside the range seen in training are clipped to it (see features.py).
        ("clip", ClipToTrainingRange()),
        # Features have very different ranges (host length ≈ 25, https ∈ {0, 1}). Scaling puts them
        # on one scale, which helps the optimiser AND makes the coefficients comparable.
        ("scaler", StandardScaler()),
        # A linear model is easy to explain: each feature adds weight × value to the log-odds.
        ("clf", LogisticRegression(max_iter=1000, random_state=0)),
    ])


def describe_pipeline(pipeline: Pipeline) -> str:
    """'ClipToTrainingRange + StandardScaler + LogisticRegression' – read from the pipeline, never typed by hand."""
    return " + ".join(type(step).__name__ for _, step in pipeline.steps)


def pipeline_config(pipeline: Pipeline) -> str:
    """Every step and hyperparameter as one line of text, e.g. "... clf=LogisticRegression clf__C=1.0 ...".

    It goes into the model version, so changing build_pipeline() (another classifier, another C)
    gives a NEW version – and model.py retrains an artifact whose config no longer matches.
    """
    params = pipeline.get_params(deep=True)
    return " ".join(
        f"{key}={type(value).__name__ if hasattr(value, 'get_params') else repr(value)}"
        for key, value in sorted(params.items())
        if key != "steps"  # the steps appear one by one as "clip=…", "scaler=…", "clf=…"
    )


def model_tag(pipeline: Pipeline) -> str:
    """Short classifier name for the version: LogisticRegression → 'logreg', RandomForestClassifier → 'rfc'."""
    name = type(pipeline[-1]).__name__
    return "logreg" if name == "LogisticRegression" else "".join(ch for ch in name if ch.isupper()).lower()


def _downsample(xs: np.ndarray, ys: np.ndarray, max_points: int = 60) -> list[dict]:
    """Curves can have thousands of points; the browser only needs enough to draw a smooth line."""
    idx = np.unique(np.linspace(0, len(xs) - 1, min(max_points, len(xs))).round().astype(int))
    return [{"x": round(float(xs[i]), 4), "y": round(float(ys[i]), 4)} for i in idx]


def _safe_div(a: float, b: float) -> float:
    return float(a / b) if b else 0.0


def thresholds_table(y_true: np.ndarray, proba: np.ndarray) -> list[dict]:
    """Confusion counts + metrics for thresholds 0.01 … 0.99, so the UI can move a slider without retraining."""
    rows = []
    for t in np.round(np.arange(0.01, 1.0, 0.01), 2):
        pred = proba >= t
        tp = int(np.sum(pred & (y_true == 1)))
        fp = int(np.sum(pred & (y_true == 0)))
        tn = int(np.sum(~pred & (y_true == 0)))
        fn = int(np.sum(~pred & (y_true == 1)))
        precision, recall = _safe_div(tp, tp + fp), _safe_div(tp, tp + fn)
        rows.append({
            "threshold": float(t), "tp": tp, "fp": fp, "tn": tn, "fn": fn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(_safe_div(2 * precision * recall, precision + recall), 4),
            "accuracy": round(_safe_div(tp + tn, len(y_true)), 4),
            "fpr": round(_safe_div(fp, fp + tn), 4),
        })
    return rows


def evaluate(pipeline: Pipeline, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    """Everything the "Model report" page needs, as plain JSON-friendly Python types."""
    proba = pipeline.predict_proba(X_test)[:, 1]  # P(suspicious) for every test URL
    pred = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, pred, labels=[0, 1]).ravel()
    fpr, tpr, _ = roc_curve(y_test, proba)
    precision, recall, _ = precision_recall_curve(y_test, proba)

    clf = pipeline.named_steps["clf"]
    coefficients = sorted(
        ({"feature": name, "label": FEATURE_LABELS[name], "weight": round(float(w), 4)}
         for name, w in zip(FEATURE_NAMES, clf.coef_[0])),
        key=lambda c: abs(c["weight"]), reverse=True,
    )

    # Calibration: when the model says "70 %", are ~70 % of those URLs really suspicious?
    bins = np.clip((proba * 10).astype(int), 0, 9)
    calibration = [
        {"bin": f"{b / 10:.1f}–{(b + 1) / 10:.1f}", "mean_predicted": round(float(proba[bins == b].mean()), 4),
         "fraction_positive": round(float(y_test[bins == b].mean()), 4), "count": int(np.sum(bins == b))}
        for b in range(10) if np.any(bins == b)
    ]
    edges = np.linspace(0, 1, 21)  # 20 bins of width 0.05 for a score histogram per class
    histogram = {
        "edges": [round(float(e), 2) for e in edges],
        "safe": np.histogram(proba[y_test == 0], bins=edges)[0].tolist(),
        "suspicious": np.histogram(proba[y_test == 1], bins=edges)[0].tolist(),
    }

    return {
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "precision": round(float(precision_score(y_test, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, proba)), 4),
        "confusion_matrix": {"threshold": 0.5, "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "roc_curve": _downsample(fpr, tpr),  # x = false-positive rate, y = true-positive rate
        "pr_curve": _downsample(recall[::-1], precision[::-1]),  # x = recall, y = precision
        "thresholds": thresholds_table(y_test, proba),
        "coefficients": coefficients,
        "intercept": round(float(clf.intercept_[0]), 4),
        "calibration": calibration,
        "score_histogram": histogram,
    }


def train_model(urls: list[str], labels: list[int], *, source: str = "synthetic", test_size: float = 0.25,
                seed: int = 42) -> tuple[dict, dict]:
    """Fit on a training split, evaluate on the held-out test split. Returns (bundle, metrics)."""
    started = time.perf_counter()
    require_both_classes(list(labels))  # a clear message instead of a scikit-learn traceback
    X, y = features_matrix(urls), np.asarray(labels, dtype=int)
    # stratify=y keeps the same share of suspicious URLs in both splits.
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, stratify=y, random_state=seed)
    pipeline = build_pipeline()
    config = pipeline_config(pipeline)
    pipeline.fit(X_train, y_train)

    trained_at = datetime.now(timezone.utc)
    # The version says WHAT, WHEN and ON WHAT DATA: the same data, features, pipeline settings and
    # scikit-learn version always give the same fingerprint – change any of them and it changes.
    recipe = f"{urls}{labels}{test_size}{seed}{FEATURE_NAMES}{config}{sklearn.__version__}"
    fingerprint = hashlib.sha256(recipe.encode()).hexdigest()[:7]
    model_version = f"url-{model_tag(pipeline)}-{trained_at:%Y%m%d}-{fingerprint}"

    metrics = {
        "model_version": model_version,
        "trained_at": trained_at.isoformat(timespec="seconds"),
        "algorithm": describe_pipeline(pipeline),
        "data_source": source,
        "sklearn_version": sklearn.__version__,
        "features": FEATURE_NAMES,
        "sizes": {
            "total": len(y), "train": len(y_train), "test": len(y_test),
            "positive_rate": round(float(y.mean()), 4),
        },
        **evaluate(pipeline, X_test, y_test),
    }
    metrics["training_seconds"] = round(time.perf_counter() - started, 3)

    # Save the metadata WITH the model: the server can then report which version answered
    # and refuse an artifact built for other features, other pipeline settings or another scikit-learn.
    bundle = {
        "pipeline": pipeline,
        "model_version": model_version,
        "trained_at": metrics["trained_at"],
        "feature_names": FEATURE_NAMES,
        "pipeline_config": config,
        "sklearn_version": sklearn.__version__,
        "data_source": source,
        "training_rows": len(y_train),
    }
    return bundle, metrics


def _replace_atomically(path: Path, write) -> None:
    """Write to a temporary file first, then rename it over `path` – a rename is all-or-nothing."""
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")  # one temp name per process
    write(tmp)
    os.replace(tmp, path)  # atomic on macOS, Linux and Windows


def save_artifacts(bundle: dict, metrics: dict, out_dir: Path = ARTIFACTS_DIR) -> tuple[Path, Path]:
    """Save both files atomically: a crash, or a second process training at the same moment, can
    never leave a half-written model.joblib behind. If only one of the two files gets replaced,
    model.py sees that their versions differ and retrains."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path, metrics_path = out_dir / "model.joblib", out_dir / "metrics.json"
    _replace_atomically(metrics_path, lambda tmp: tmp.write_text(json.dumps(metrics, indent=2)))
    _replace_atomically(model_path, lambda tmp: joblib.dump(bundle, tmp))
    return model_path, metrics_path


def train_and_save(csv_path: str | Path | None = None, out_dir: Path = ARTIFACTS_DIR, n: int = 4000) -> tuple[dict, dict]:
    if csv_path:
        urls, labels = load_csv(csv_path)
        source = f"csv:{Path(csv_path).name}"
    else:
        urls, labels = make_dataset(n=n)
        source = f"synthetic ({n} fictional URLs)"
    bundle, metrics = train_model(urls, labels, source=source)
    save_artifacts(bundle, metrics, out_dir)
    return bundle, metrics


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Train the toy suspicious-URL classifier.")
    parser.add_argument("--csv", help="CSV with url,label columns; label 1/suspicious or 0/safe (default: synthetic)")
    parser.add_argument("--out", default=str(ARTIFACTS_DIR), help="folder for model.joblib and metrics.json")
    parser.add_argument("--n", type=int, default=4000, help="size of the synthetic dataset (at least 20)")
    args = parser.parse_args(argv)
    if args.n < 20:
        parser.error("--n must be at least 20: the test split needs examples of both classes")

    try:
        _, metrics = train_and_save(args.csv, Path(args.out), n=args.n)
    except (ValueError, OSError, csv.Error) as error:
        # A missing file or a bad row is the user's input, not a bug: one clear line, exit code 2.
        parser.error(str(error))
    print(f"Trained {metrics['model_version']} on {metrics['sizes']['train']} rows "
          f"in {metrics['training_seconds']} s")
    print(f"Test set ({metrics['sizes']['test']} rows): accuracy {metrics['accuracy']:.3f}, "
          f"precision {metrics['precision']:.3f}, recall {metrics['recall']:.3f}, ROC AUC {metrics['roc_auc']:.3f}")
    print(f"Saved to {args.out}")


if __name__ == "__main__":
    main()
