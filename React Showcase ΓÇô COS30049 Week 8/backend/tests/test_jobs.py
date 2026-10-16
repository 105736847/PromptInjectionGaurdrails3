"""Tests for app/routers/jobs.py – start (202), poll, cancel, fail."""
import time

import pytest

from app.routers import jobs


@pytest.fixture(autouse=True)
def fast_steps(monkeypatch):
    monkeypatch.setattr(jobs, "STEP_SECONDS", 0.01)  # don't wait 0.6 s per step in tests


def wait_until_finished(client, job_id, timeout=5.0):
    """Poll like the front end does, until the job reaches a final state."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        job = client.get(f"/api/jobs/{job_id}").json()
        if job["status"] in {"completed", "failed", "cancelled"}:
            return job
        time.sleep(0.02)
    raise AssertionError(f"job {job_id} did not finish: {job}")


def test_start_returns_202_immediately_and_completes(client):
    response = client.post("/api/jobs", json={"kind": "train-model", "steps": 5})
    assert response.status_code == 202
    job = response.json()
    assert job["status"] in {"queued", "running"}
    assert response.headers["location"] == f"/api/jobs/{job['id']}"

    done = wait_until_finished(client, job["id"])
    assert done["status"] == "completed"
    assert (done["step"], done["progress"]) == (5, 100)
    assert "accuracy" in done["result"]
    assert any("Epoch 5/5" in line["text"] for line in done["log"])
    assert done["log"][0]["time"].endswith("Z")  # UTC – the browser shows it in local time
    assert done["finished_at"] is not None


def test_several_jobs_run_at_once_and_are_listed(client):
    ids = [client.post("/api/jobs", json={"kind": kind, "steps": 3}).json()["id"] for kind in ("generate-report", "import-data")]
    for job_id in ids:
        assert wait_until_finished(client, job_id)["status"] == "completed"
    listed = [job["id"] for job in client.get("/api/jobs").json()]
    assert listed[:2] == ids[::-1]  # newest first


def test_simulated_failure_is_reported(client):
    job = client.post("/api/jobs", json={"kind": "import-data", "steps": 4, "fail_at": 2}).json()
    done = wait_until_finished(client, job["id"])
    assert done["status"] == "failed"
    assert "step 2" in done["error"]
    assert done["step"] == 1


def test_cancel_a_running_job(client, monkeypatch):
    monkeypatch.setattr(jobs, "STEP_SECONDS", 0.05)
    job = client.post("/api/jobs", json={"steps": 30}).json()
    time.sleep(0.12)

    response = client.delete(f"/api/jobs/{job['id']}")
    assert response.status_code == 202
    assert response.json()["status"] == "cancelling"

    done = wait_until_finished(client, job["id"])
    assert done["status"] == "cancelled"
    assert done["step"] < 30
    # A finished job cannot be cancelled again.
    assert client.delete(f"/api/jobs/{job['id']}").status_code == 409


def test_unknown_job_is_404(client):
    assert client.get("/api/jobs/nope").status_code == 404
    assert client.delete("/api/jobs/nope").status_code == 404


@pytest.mark.parametrize(
    "body",
    [{"steps": 0}, {"steps": 31}, {"kind": "mine-bitcoin"}, {"steps": 3, "fail_at": 4}, {"fail_at": 0}],
)
def test_invalid_requests_are_422(client, body):
    assert client.post("/api/jobs", json=body).status_code == 422
