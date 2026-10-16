"""
jobs.py – long-running background jobs whose progress the front end polls.

Some work takes far longer than one HTTP request should (training a model, building a
report, importing a big file). Instead of making the browser wait, we:

    POST   /api/jobs          start the work in the background → 202 Accepted + the job id
    GET    /api/jobs/{id}     "how far are you?" – the front end asks every ~500 ms (polling)
    GET    /api/jobs          every job, newest first
    DELETE /api/jobs/{id}     ask a running job to stop (cancel)

How the work runs: `asyncio.create_task()` starts a coroutine on the server's event loop and
returns at once, so the POST can answer 202 while the job keeps going.
(FastAPI's `BackgroundTasks` is the simpler tool for fire-and-forget work such as sending an
e-mail after a response – but it gives you no handle to report progress or cancel.)

Send data, not formatted text: every log line carries its time as an ISO date in UTC, and the
browser shows it in the viewer's own time zone (the server may be in another country).

Cancelling is COOPERATIVE: DELETE only sets status = "cancelling"; the job checks that flag
between steps and stops cleanly. The same idea works for a real ML training loop that checks
a flag after every epoch.

Limits of this simple version: jobs live in a dict in memory, so they vanish when the server
restarts and are not shared between several server processes. Real systems keep jobs in a
database or use a task queue (Celery, RQ, ARQ, Dramatiq) with separate worker processes.

Docs: https://fastapi.tiangolo.com/tutorial/background-tasks/
"""
import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel, Field, model_validator

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

JobKind = Literal["train-model", "generate-report", "import-data"]
JobStatus = Literal["queued", "running", "cancelling", "completed", "failed", "cancelled"]
FINISHED = {"completed", "failed", "cancelled"}

STEP_SECONDS = 0.6  # pretend each step takes this long (tests make it smaller)
MAX_JOBS = 50  # forget the oldest finished jobs after this many
MAX_LOG_LINES = 100


class JobCreate(BaseModel):
    kind: JobKind = "train-model"
    steps: int = Field(8, ge=1, le=30, description="How many steps the job has (about 0.6 s each)")
    fail_at: int | None = Field(None, ge=1, description="Simulate a crash at this step – to test error handling")

    model_config = {"json_schema_extra": {"examples": [{"kind": "train-model", "steps": 8}]}}

    @model_validator(mode="after")
    def fail_within_steps(self) -> "JobCreate":
        if self.fail_at is not None and self.fail_at > self.steps:
            raise ValueError(f"fail_at must be between 1 and steps ({self.steps})")
        return self


class LogLine(BaseModel):
    time: datetime  # UTC ("…Z" in the JSON) – the front end formats it for the viewer
    text: str


class Job(BaseModel):
    id: str
    kind: JobKind
    status: JobStatus = "queued"
    steps: int
    step: int = 0  # steps finished so far
    progress: float = 0.0  # 0–100 %
    log: list[LogLine] = []
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None


# The "database" of jobs, plus strong references to the running tasks:
# asyncio only keeps a weak reference, so an unreferenced task can be garbage-collected mid-run.
_jobs: dict[str, Job] = {}
_tasks: set[asyncio.Task] = set()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _log(job: Job, text: str) -> None:
    job.log.append(LogLine(time=_now(), text=text))
    del job.log[:-MAX_LOG_LINES]  # keep only the newest lines


def _describe(kind: str, step: int, steps: int, rng: random.Random) -> str:
    """A believable log line for each kind of job."""
    if kind == "train-model":
        loss = 2.3 * (0.72 ** step) + rng.uniform(0.01, 0.05)
        return f"Epoch {step}/{steps} – loss {loss:.3f}"
    if kind == "generate-report":
        return f"Rendered page {step} of {steps}"
    return f"Imported rows {(step - 1) * 250 + 1}–{step * 250}"


def _result(kind: str, steps: int, rng: random.Random) -> dict[str, Any]:
    if kind == "train-model":
        return {"accuracy": round(min(0.99, 0.7 + 0.025 * steps + rng.uniform(-0.02, 0.02)), 3)}
    if kind == "generate-report":
        return {"pages": steps, "file": f"report-{steps}p.pdf"}
    return {"rows_imported": steps * 250}


async def _run(job: Job, fail_at: int | None) -> None:
    """The background work. It only *awaits*, so the server keeps answering other requests."""
    rng = random.Random()
    if job.status == "queued":  # (it may already be "cancelling" if DELETE arrived first)
        job.status = "running"
    job.started_at = _now()
    _log(job, f"Started {job.kind} ({job.steps} steps)")
    try:
        for step in range(1, job.steps + 1):
            await asyncio.sleep(STEP_SECONDS * rng.uniform(0.6, 1.4))  # stand-in for real work
            if job.status == "cancelling":  # cooperative cancellation: check between steps
                job.status = "cancelled"
                _log(job, f"Cancelled before step {step}")
                return
            if step == fail_at:
                raise RuntimeError(f"Simulated failure at step {step}: the input data is corrupt")
            job.step, job.progress = step, round(100 * step / job.steps, 1)
            _log(job, _describe(job.kind, step, job.steps, rng))
        job.result = _result(job.kind, job.steps, rng)
        job.status = "completed"
        _log(job, "Finished ✔")
    except Exception as exc:  # report the problem to the client instead of losing it
        job.status, job.error = "failed", str(exc)
        _log(job, f"Failed: {exc}")
    finally:
        job.finished_at = _now()


def _forget_old_jobs() -> None:
    finished = [job for job in _jobs.values() if job.status in FINISHED]
    for job in finished[: max(0, len(_jobs) - MAX_JOBS)]:  # dicts keep insertion order: oldest first
        del _jobs[job.id]


def _get_job(job_id: str) -> Job:
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} was not found.")
    return job


# These endpoints are `async def`: they do no blocking work, and running on the event-loop
# thread (like the job tasks) means they never race with a job that is updating itself.
@router.post(
    "",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=Job,
    summary="Start a background job",
    response_description="Accepted – the job is running. Poll the URL in the Location header.",
)
async def start_job(body: JobCreate, response: Response) -> Job:
    job = Job(id=uuid.uuid4().hex[:8], kind=body.kind, steps=body.steps, created_at=_now())
    _jobs[job.id] = job
    _forget_old_jobs()

    task = asyncio.create_task(_run(job, body.fail_at))  # starts now, finishes later
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)

    response.headers["Location"] = f"/api/jobs/{job.id}"  # "here is where to ask for progress"
    return job


@router.get("", response_model=list[Job], summary="List jobs (newest first)")
async def list_jobs(limit: Annotated[int, Query(ge=1, le=MAX_JOBS)] = 20) -> list[Job]:
    return list(reversed(_jobs.values()))[:limit]


@router.get(
    "/{job_id}",
    response_model=Job,
    summary="Get a job's progress and log",
    responses={404: {"description": "No such job"}},
)
async def get_job(job_id: str) -> Job:
    return _get_job(job_id)


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=Job,
    summary="Cancel a running job",
    responses={404: {"description": "No such job"}, 409: {"description": "The job has already finished"}},
)
async def cancel_job(job_id: str) -> Job:
    """202 again: the job stops at its next step – keep polling to see "cancelled"."""
    job = _get_job(job_id)
    if job.status in FINISHED:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"Job {job_id} has already {job.status}.")
    if job.status != "cancelling":
        job.status = "cancelling"
        _log(job, "Cancel requested – stopping after the current step…")
    return job
