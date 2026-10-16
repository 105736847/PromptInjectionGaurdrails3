"""
test_ml.py – the ML package (features, dataset, training, model) and the /api/ml endpoints.

Training on the toy data takes well under a second, so the tests train real
(small) models in a temporary folder instead of mocking scikit-learn.
"""
import csv
import json
import math

import numpy as np
import pytest
from fastapi.testclient import TestClient
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.main import app
from app.ml import dataset, train
from app.ml import model as model_module
from app.ml.features import FEATURE_NAMES, ClipToTrainingRange, extract_features, features_matrix, shannon_entropy
from app.ml.model import UrlModel, get_model
from app.routers.ml import MAX_BATCH_ROWS, MAX_UPLOAD_BYTES

SAFE_URL = "https://www.brightwater-uni.example/courses/cos30049"
SUSPICIOUS_URL = "http://brightwater-uni-support-verify.test/secure/login/x8f2k9?id=a8f3kq2z9x&n=48213"


# ---------- features ---------------------------------------------------------------
def test_feature_names_are_stable():
    assert len(FEATURE_NAMES) == 12
    assert list(extract_features(SAFE_URL)) == FEATURE_NAMES  # dict order = column order


def test_extract_features_reads_the_url_parts():
    f = extract_features("http://brightwater-uni.example@198.51.100.7/a/b/signin")
    assert f["has_at"] == 1 and f["ip_host"] == 1 and f["https"] == 0
    assert f["subdomains"] == 0  # an IP address has no sub-domains
    assert f["path_depth"] == 3
    assert f["suspicious_words"] == 1

    g = extract_features("https://a.b.shop.example/login?x=1&y=2")
    assert g["https"] == 1 and g["ip_host"] == 0 and g["subdomains"] == 2
    assert g["host_length"] == len("a.b.shop.example")
    assert g["special_chars"] == 4  # ? = & =
    assert g["digits"] == 2


def test_extract_features_never_crashes_on_odd_input():
    for url in ["no-scheme.example/path", "http://[not-an-ip", "💥", "x" * 3000]:
        values = extract_features(url)
        assert all(isinstance(v, float) and math.isfinite(v) for v in values.values())


def test_clip_to_training_range():
    clip = ClipToTrainingRange().fit(np.array([[1.0, 10.0], [3.0, 20.0]]))
    assert clip.transform(np.array([[0.0, 15.0], [9.0, 99.0]])).tolist() == [[1.0, 15.0], [3.0, 20.0]]


def test_entropy_and_matrix_shape():
    assert shannon_entropy("") == 0 and shannon_entropy("aaaa") == 0
    assert shannon_entropy("abcd") == pytest.approx(2.0)
    assert features_matrix([SAFE_URL, SUSPICIOUS_URL]).shape == (2, 12)
    assert features_matrix([]).shape == (0, 12)


# ---------- dataset -----------------------------------------------------------------
def test_dataset_is_deterministic_and_fictional():
    urls, labels = dataset.make_dataset(n=300, seed=7)
    assert (urls, labels) == dataset.make_dataset(n=300, seed=7)
    assert set(labels) == {0, 1}
    fictional = (".example", ".test", ".invalid", "192.0.2.", "198.51.100.", "203.0.113.")
    for url in urls:
        host = url.split("://", 1)[1].split("/", 1)[0].split("@")[-1]
        assert any(part in host for part in fictional), url


def test_load_csv_checks_columns_and_labels(tmp_path):
    good = tmp_path / "good.csv"
    # The same label words as the batch endpoint: 0/1, safe/suspicious, false/true.
    good.write_text("url,label\nhttps://a.example/,0\nhttp://203.0.113.1/login,1\n,1\n"
                    "https://b.example/,Safe\nhttp://203.0.113.2/verify,suspicious\n")
    assert dataset.load_csv(good) == (
        ["https://a.example/", "http://203.0.113.1/login", "https://b.example/", "http://203.0.113.2/verify"],
        [0, 1, 0, 1],
    )

    (tmp_path / "no_label.csv").write_text("url\nhttps://a.example/\n")
    with pytest.raises(ValueError, match="columns"):
        dataset.load_csv(tmp_path / "no_label.csv")
    (tmp_path / "bad_label.csv").write_text('url,label\n"https://a.example/\nsecond line",maybe\n')
    with pytest.raises(ValueError, match=r"line 3: label must be 0/1 or safe/suspicious, got 'maybe'"):
        dataset.load_csv(tmp_path / "bad_label.csv")
    (tmp_path / "one_class.csv").write_text("url,label\nhttps://a.example/,0\nhttps://b.example/,0\nhttp://c.test/,1\n")
    with pytest.raises(ValueError, match="BOTH classes.*2 safe and 1 suspicious"):
        dataset.load_csv(tmp_path / "one_class.csv")


# ---------- training ----------------------------------------------------------------
@pytest.fixture(scope="module")
def small_training():
    urls, labels = dataset.make_dataset(n=800, seed=3)
    return train.train_model(urls, labels, source="test")


def test_training_produces_a_useful_model_and_complete_metrics(small_training):
    bundle, metrics = small_training
    assert bundle["feature_names"] == FEATURE_NAMES
    assert metrics["model_version"].startswith("url-logreg-")
    assert metrics["roc_auc"] > 0.85 and metrics["accuracy"] > 0.8
    for key in ("precision", "recall", "f1", "confusion_matrix", "roc_curve", "pr_curve", "coefficients",
                "calibration", "score_histogram", "sizes", "trained_at", "intercept"):
        assert key in metrics
    assert metrics["sizes"] == {"total": 800, "train": 600, "test": 200, "positive_rate": metrics["sizes"]["positive_rate"]}
    cm = metrics["confusion_matrix"]
    assert cm["tn"] + cm["fp"] + cm["fn"] + cm["tp"] == 200
    assert len(metrics["thresholds"]) == 99 and metrics["thresholds"][49]["threshold"] == 0.5
    assert len(metrics["roc_curve"]) <= 60 and metrics["roc_curve"][0] == {"x": 0.0, "y": 0.0}
    json.dumps(metrics)  # everything must be plain JSON types (no NumPy floats)


def test_thresholds_table_trades_recall_for_precision(small_training):
    rows = small_training[1]["thresholds"]
    recalls = [r["recall"] for r in rows]
    assert recalls == sorted(recalls, reverse=True)  # a higher threshold never finds MORE positives
    assert rows[0]["recall"] >= rows[-1]["recall"] and rows[0]["fp"] >= rows[-1]["fp"]
    row = rows[49]
    cm = small_training[1]["confusion_matrix"]
    assert (row["tp"], row["fp"], row["tn"], row["fn"]) == (cm["tp"], cm["fp"], cm["tn"], cm["fn"])


def test_version_changes_when_the_pipeline_changes(small_training, monkeypatch):
    urls, labels = dataset.make_dataset(n=800, seed=3)  # the SAME data as small_training
    monkeypatch.setattr(train, "build_pipeline", lambda: Pipeline([
        ("clip", ClipToTrainingRange()), ("scaler", StandardScaler()), ("clf", LogisticRegression(C=0.01)),
    ]))
    bundle, metrics = train.train_model(urls, labels, source="test")
    assert metrics["model_version"] != small_training[1]["model_version"]  # another C → another version
    assert bundle["pipeline_config"] != small_training[0]["pipeline_config"]
    assert metrics["algorithm"] == "ClipToTrainingRange + StandardScaler + LogisticRegression"


def test_train_cli_with_csv_writes_artifacts(tmp_path):
    urls, labels = dataset.make_dataset(n=300, seed=11)
    csv_path = tmp_path / "my_urls.csv"
    with csv_path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["url", "label"])
        writer.writerows(zip(urls, labels))
    out = tmp_path / "artifacts"
    train.main(["--csv", str(csv_path), "--out", str(out)])
    metrics = json.loads((out / "metrics.json").read_text())
    assert (out / "model.joblib").exists()
    assert metrics["data_source"] == "csv:my_urls.csv" and metrics["sizes"]["total"] == 300
    assert sorted(p.name for p in out.iterdir()) == ["metrics.json", "model.joblib"]  # no temp files left


@pytest.mark.parametrize(
    ("args", "content", "message"),
    [
        (["--csv", "missing.csv"], None, "No such file"),
        (["--csv", "words.csv"], "url,label\nhttps://a.example/,maybe\n", "label must be 0/1"),
        (["--csv", "tiny.csv"], "url,label\nhttps://a.example/,0\nhttp://b.test/,1\n", "BOTH classes"),
        (["--n", "5"], None, "at least 20"),
    ],
)
def test_train_cli_reports_bad_input_in_one_line(tmp_path, monkeypatch, capsys, args, content, message):
    monkeypatch.chdir(tmp_path)
    if content:
        (tmp_path / args[1]).write_text(content)
    with pytest.raises(SystemExit) as exit_info:
        train.main([*args, "--out", str(tmp_path / "out")])
    assert exit_info.value.code == 2  # argparse's "usage error" code – no traceback
    assert message in capsys.readouterr().err


# ---------- model -------------------------------------------------------------------
@pytest.fixture(scope="module")
def tmp_model(tmp_path_factory):
    folder = tmp_path_factory.mktemp("artifacts")
    return UrlModel.from_artifacts(folder)  # nothing there yet → trains automatically


def test_model_trains_when_missing_then_loads(tmp_model):
    assert tmp_model.trained_on_load is True
    before = tmp_model.predictions_served
    tmp_model.warm_up()
    assert tmp_model.predictions_served == before  # warming up is not a real prediction
    folder = train.ARTIFACTS_DIR  # the real artifact exists after the app started once
    again = UrlModel.from_artifacts(folder)
    assert again.version and again.metrics["model_version"] == again.version


@pytest.mark.parametrize(
    ("change", "reason"),
    [
        ({"feature_names": ["an", "old", "feature", "list"]}, "features.py changed"),
        ({"pipeline_config": "clf=RandomForestClassifier"}, "build_pipeline() in train.py changed"),
        ({"sklearn_version": "0.1"}, "scikit-learn 0.1"),
        ({"model_version": "url-logreg-20200101-0000000"}, "belong to different models"),
    ],
)
def test_model_retrains_a_stale_artifact(tmp_path, capsys, change, reason):
    bundle, metrics = train.train_model(*dataset.make_dataset(n=300, seed=1), source="old")
    train.save_artifacts({**bundle, **change}, metrics, tmp_path)
    reloaded = UrlModel.from_artifacts(tmp_path)
    assert reloaded.trained_on_load is True and reason in capsys.readouterr().out
    assert reloaded.metrics["model_version"] == reloaded.version  # the new pair matches again


def test_model_loads_a_fresh_artifact_without_training(tmp_path):
    train.save_artifacts(*train.train_model(*dataset.make_dataset(n=300, seed=1), source="fresh"), tmp_path)
    assert UrlModel.from_artifacts(tmp_path).trained_on_load is False


def test_explanation_adds_up_to_the_probability(tmp_model):
    result = tmp_model.predict(SUSPICIOUS_URL)
    total = result["intercept"] + sum(c["contribution"] for c in result["contributions"])
    assert total == pytest.approx(result["logit"], abs=1e-3)
    assert 1 / (1 + math.exp(-result["logit"])) == pytest.approx(result["probability"], abs=1e-3)
    assert [c["feature"] for c in result["contributions"]] == FEATURE_NAMES


def test_padding_a_url_cannot_switch_the_model_off(tmp_model):
    # The API accepts 2,048 characters; training URLs are ~110 at most. Clipping stops a linear
    # model from extrapolating, so appending letters must not turn "suspicious" into "safe".
    padded = tmp_model.predict(SUSPICIOUS_URL + "/" + "a" * 300)
    assert padded["probability"] > 0.5
    assert any(c["clipped_to"] is not None for c in padded["contributions"])  # the explanation says so
    total = padded["intercept"] + sum(c["contribution"] for c in padded["contributions"])
    assert total == pytest.approx(padded["logit"], abs=1e-3)  # still exact after clipping
    assert all(c["clipped_to"] is None for c in tmp_model.predict(SAFE_URL)["contributions"])


def test_predict_many_matches_predict(tmp_model):
    urls = [SAFE_URL, SUSPICIOUS_URL]
    batch = tmp_model.predict_many(urls, 0.5)
    singles = [tmp_model.predict(u, 0.5) for u in urls]
    for b, s in zip(batch, singles):
        assert b["probability"] == pytest.approx(s["probability"]) and b["label"] == s["label"]
    assert tmp_model.predict_many([], 0.5) == []


# ---------- API: start-up ------------------------------------------------------------------
def test_model_is_loaded_at_start_up_not_in_the_first_request(monkeypatch, tmp_path):
    from app.config import settings

    monkeypatch.setattr(settings, "upload_dir", tmp_path / "uploads")
    monkeypatch.setattr(model_module, "_model", None)  # pretend the server has just been started
    with TestClient(app):  # entering runs every lifespan, exactly like `uvicorn` starting up
        assert model_module._model is not None  # loaded by the ml router's lifespan – no request sent yet


# ---------- API: read-only endpoints ---------------------------------------------------
def test_info(client):
    body = client.get("/api/ml/info").json()
    assert body["model_version"].startswith("url-logreg-")
    assert [f["name"] for f in body["features"]] == FEATURE_NAMES
    assert body["max_batch_rows"] == MAX_BATCH_ROWS and body["max_upload_bytes"] == MAX_UPLOAD_BYTES
    assert set(body["test_metrics"]) == {"accuracy", "precision", "recall", "f1", "roc_auc"}


def test_metrics(client):
    body = client.get("/api/ml/metrics").json()
    assert len(body["thresholds"]) == 99 and body["roc_auc"] > 0.9
    assert body["model_version"] == client.get("/api/ml/info").json()["model_version"]


def test_examples(client):
    examples = client.get("/api/ml/examples").json()
    assert len(examples) >= 6
    assert {e["expected"] for e in examples} == {"safe", "suspicious"}


# ---------- API: predict ----------------------------------------------------------------
def test_predict_returns_probability_label_and_explanation(client):
    response = client.post("/api/ml/predict", json={"url": f"  {SUSPICIOUS_URL}  "})
    assert response.status_code == 200
    body = response.json()
    assert body["url"] == SUSPICIOUS_URL  # surrounding spaces are stripped
    assert 0 <= body["probability"] <= 1 and body["threshold"] == 0.5
    assert body["label"] == ("suspicious" if body["probability"] >= 0.5 else "safe")
    assert len(body["contributions"]) == 12 and body["latency_ms"] >= 0
    assert {"value", "clipped_to", "scaled", "weight", "contribution"} <= set(body["contributions"][0])
    assert body["model_version"].startswith("url-logreg-")


def test_suspicious_url_scores_higher_than_safe_url(client):
    safe = client.post("/api/ml/predict", json={"url": SAFE_URL}).json()
    bad = client.post("/api/ml/predict", json={"url": SUSPICIOUS_URL}).json()
    assert bad["probability"] > 0.9 > 0.5 > safe["probability"]
    assert (safe["label"], bad["label"]) == ("safe", "suspicious")


def test_threshold_changes_only_the_label(client):
    low = client.post("/api/ml/predict", json={"url": SAFE_URL, "threshold": 0.01}).json()
    high = client.post("/api/ml/predict", json={"url": SAFE_URL, "threshold": 0.99}).json()
    assert low["probability"] == high["probability"]
    assert (low["label"], high["label"]) == ("suspicious", "safe")


@pytest.mark.parametrize(
    ("payload", "field", "message"),
    [
        ({"url": ""}, "url", "Please enter a URL."),
        ({"url": "    "}, "url", "Please enter a URL."),
        ({"url": "http://a.example/with space"}, "url", "A URL cannot contain spaces."),
        ({"url": "http://a.example/" + "x" * 2100}, "url", "at most 2048"),
        ({}, "url", "Field required"),
        ({"url": SAFE_URL, "threshold": 1.5}, "threshold", "less than or equal to 0.99"),
        ({"url": SAFE_URL, "threshold": "high"}, "threshold", "valid number"),
    ],
)
def test_predict_validation_errors(client, payload, field, message):
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"][-1] == field and message in error["msg"]


def test_predictions_are_counted(client):
    before = client.get("/api/ml/info").json()["predictions_served"]
    client.post("/api/ml/predict", json={"url": SAFE_URL})
    assert client.get("/api/ml/info").json()["predictions_served"] == before + 1


def test_model_dependency_can_be_overridden(client, tmp_model):
    app.dependency_overrides[get_model] = lambda: tmp_model
    body = client.post("/api/ml/predict", json={"url": SAFE_URL}).json()
    assert body["model_version"] == tmp_model.version


# ---------- API: batch ------------------------------------------------------------------
def upload(client, content: bytes | str, filename="urls.csv", content_type="text/csv", **form):
    data = content.encode() if isinstance(content, str) else content
    return client.post("/api/ml/predict/batch", files={"file": (filename, data, content_type)}, data=form)


def test_batch_predicts_every_row_and_scores_labels(client):
    csv_text = f"URL,Label\n{SAFE_URL},0\n{SUSPICIOUS_URL},1\n\nhttps://docs.pyfriends.example/tutorial,safe\n"
    response = upload(client, csv_text)
    assert response.status_code == 200
    body = response.json()
    assert [r["row"] for r in body["results"]] == [2, 3, 5]  # the blank line 4 is ignored
    assert [r["label"] for r in body["results"]][:2] == ["safe", "suspicious"]
    summary = body["summary"]
    assert summary["rows"] == 3 and summary["predicted"] == 3 and summary["skipped"] == 0
    assert summary["suspicious"] + summary["safe"] == 3
    assert summary["accuracy"] == 1.0 and summary["filename"] == "urls.csv"


def test_batch_skips_bad_rows_and_honours_threshold(client):
    csv_text = f"id,url\n1,{SAFE_URL}\n2,\n3,http://a.example/has space\n4\n"
    body = upload(client, csv_text, threshold="0.01").json()
    assert [r["row"] for r in body["results"]] == [2]
    assert body["results"][0]["label"] == "suspicious" and body["results"][0]["actual"] is None
    assert [s["row"] for s in body["skipped"]] == [3, 4, 5]
    assert body["summary"]["accuracy"] is None and body["summary"]["threshold"] == 0.01


def test_batch_rows_are_file_lines_even_with_multi_line_cells(client):
    csv_text = ('url,note\n'
                'https://a.example/,"first line\nsecond line\nthird line"\n'  # ONE record on lines 2–4
                'https://b.example/,ok\n'
                ',empty url here\n')
    body = upload(client, csv_text).json()
    assert [(r["row"], r["url"]) for r in body["results"]] == [(2, "https://a.example/"), (5, "https://b.example/")]
    assert body["skipped"] == [{"row": 6, "reason": "The url cell is empty."}]


def test_batch_accepts_excel_style_csv(client):
    content = "﻿url\r\n" + SAFE_URL + "\r\n"  # BOM + Windows line endings
    assert upload(client, content.encode("utf-8"), content_type="application/vnd.ms-excel").status_code == 200


@pytest.mark.parametrize(
    ("kwargs", "status_code", "text"),
    [
        ({"content": "url\nhttps://a.example\n", "filename": "urls.txt", "content_type": "text/plain"}, 415, ".csv"),
        ({"content": b"\x89PNG....", "filename": "photo.csv", "content_type": "image/png"}, 415, ".csv"),
        ({"content": "url\n" + "https://a.example/x\n" * 60_000}, 413, "larger than 1 MB"),
        ({"content": ""}, 400, "empty"),
        ({"content": b"\xef\xbb\xbf"}, 400, "empty"),  # only a BOM: an empty sheet saved as "CSV UTF-8"
        ({"content": b"\xef\xbb\xbf\r\n  \r\n"}, 400, "empty"),
        ({"content": b"url\n\xff\xfe\xfa bad bytes"}, 400, "UTF-8"),
        ({"content": "url\n\"https://a.example/unclosed\n"}, 400, "could not be read"),
        ({"content": "name,link\nx,https://a.example\n"}, 422, "'url' column"),
        ({"content": "url\n" + "https://a.example/\n" * (MAX_BATCH_ROWS + 1)}, 422, "Too many rows"),
        ({"content": "url,label\n,1\n  ,0\n"}, 422, "No valid URLs"),
    ],
)
def test_batch_errors(client, kwargs, status_code, text):
    response = upload(client, **kwargs)
    assert response.status_code == status_code, response.text
    assert text in response.json()["detail"]


def test_batch_threshold_is_validated(client):
    response = upload(client, f"url\n{SAFE_URL}\n", threshold="2")
    assert response.status_code == 422 and response.json()["detail"][0]["loc"][-1] == "threshold"


# ---------- API documentation -----------------------------------------------------------------
def test_endpoints_are_documented(client):
    paths = client.get("/api/openapi.json").json()["paths"]
    for path in ("/api/ml/info", "/api/ml/metrics", "/api/ml/examples", "/api/ml/predict", "/api/ml/predict/batch"):
        assert path in paths
    batch = paths["/api/ml/predict/batch"]["post"]
    assert {"400", "413", "415", "422"} <= set(batch["responses"])
    assert paths["/api/ml/predict"]["post"]["summary"] == "Classify one URL"
