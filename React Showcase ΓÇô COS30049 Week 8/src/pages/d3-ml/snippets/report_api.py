# report_api.py – compute your model's evaluation numbers in Python and serve
# them as JSON, so React only has to DRAW them.
# Install:  pip install fastapi uvicorn scikit-learn pandas joblib
# Run:      uvicorn report_api:app --reload --port 8000
# Try it:   http://localhost:8000/api/report   (or the docs at /docs)
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sklearn.calibration import calibration_curve
from sklearn.metrics import (average_precision_score, confusion_matrix,
                             precision_recall_curve, roc_auc_score, roc_curve)

app = FastAPI(title="Phishing URL Detector – model report")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # the React dev server
    allow_methods=["GET"],
    allow_headers=["*"],
)

FEATURES = ["url_length", "num_dots", "num_subdomains", "has_https", "special_chars", "domain_age_days"]
model = joblib.load("phishing_model.joblib")  # load ONCE at start-up, not per request
test = pd.read_csv("test_urls.csv")           # the held-out test set: url, features…, label
X_test, y_test = test[FEATURES], test["label"].to_numpy()


def thin(*arrays, n=200):
    """Curves can have thousands of points – send at most n of them to the browser."""
    idx = np.unique(np.linspace(0, len(arrays[0]) - 1, min(n, len(arrays[0]))).astype(int))
    return [np.asarray(a)[idx].round(4).tolist() for a in arrays]


@app.get("/api/report")
def report():
    scores = model.predict_proba(X_test)[:, 1]  # P(phishing) for every test URL

    fpr, tpr, roc_thr = roc_curve(y_test, scores)
    roc_thr = np.clip(roc_thr, 0, 1)  # the first threshold is +inf – JSON can't hold that
    precision, recall, pr_thr = precision_recall_curve(y_test, scores)
    observed, predicted = calibration_curve(y_test, scores, n_bins=10)
    tn, fp, fn, tp = confusion_matrix(y_test, scores >= 0.5).ravel()
    # For a Pipeline the fitted estimator is the last step: model[-1].feature_importances_
    importances = sorted(zip(FEATURES, model.feature_importances_), key=lambda pair: -pair[1])

    fpr, tpr, roc_thr = thin(fpr, tpr, roc_thr)
    precision, recall, pr_thr = thin(precision[:-1], recall[:-1], pr_thr)  # align with thresholds

    # NumPy numbers are NOT JSON-serialisable – convert with float() / int() / .tolist().
    return {
        "model": type(model).__name__,
        "n_test": int(len(y_test)),
        "roc": {"auc": round(float(roc_auc_score(y_test, scores)), 4),
                "fpr": fpr, "tpr": tpr, "thresholds": roc_thr},
        "pr": {"ap": round(float(average_precision_score(y_test, scores)), 4),
               "precision": precision, "recall": recall, "thresholds": pr_thr},
        "confusion_matrix": {"threshold": 0.5, "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "feature_importance": [{"feature": f, "value": round(float(v), 4)} for f, v in importances],
        "calibration": {"predicted": predicted.round(4).tolist(), "observed": observed.round(4).tolist()},
        # The raw scores let the front-end move the threshold without asking the server again.
        "scores": [{"score": round(float(s), 4), "label": int(y)} for s, y in zip(scores, y_test)],
    }
