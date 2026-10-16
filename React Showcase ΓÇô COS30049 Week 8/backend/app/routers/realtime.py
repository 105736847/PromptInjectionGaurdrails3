"""
realtime.py – the server PUSHES data to the browser.

    WebSocket  /api/ws/training                     two-way: the browser sends start/stop, the server
                                                   streams one message per training epoch
    WebSocket  /api/ws/chat?name=Mia                many browsers at once: a chat room (broadcast)
    GET        /api/stream/events                  Server-Sent Events: a one-way live feed over HTTP
    POST       /api/stream/connections/{id}/drop   end one event stream – to watch the browser reconnect
    GET        /api/stream/countdown               the same format written BY HAND with StreamingResponse

Why `async def` everywhere here? A WebSocket or an event stream stays open for minutes and
spends almost all of that time *waiting*. `await` hands the waiting time back to the event
loop, so one server process can hold thousands of open connections. A blocking call such as
time.sleep() would freeze every one of them – always use `await asyncio.sleep()`.

Long-lived connections and `uvicorn --reload`: on every restart uvicorn first waits for open
HTTP responses to finish – and by default it waits forever. That is why every event stream
below ends by itself after MAX_STREAM_SECONDS (the browser just reconnects). Also start the
server with a short grace period, so nothing can hold a restart up for long:
    uvicorn app.main:app --reload --timeout-graceful-shutdown 2

WebSocket routes are not listed in /api/docs (OpenAPI only describes HTTP requests).
Try them from the browser console instead:
    const ws = new WebSocket('ws://localhost:8000/api/ws/training');
    ws.onmessage = (e) => console.log(JSON.parse(e.data));
    ws.onopen = () => ws.send(JSON.stringify({ action: 'start', epochs: 10 }));

Docs: https://fastapi.tiangolo.com/advanced/websockets/
      https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
"""
import asyncio
import json
import math
import random
import uuid
from collections import deque
from collections.abc import AsyncIterable, AsyncIterator
from contextlib import suppress
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Header, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
from fastapi.sse import EventSourceResponse, ServerSentEvent  # new in recent FastAPI versions
from pydantic import BaseModel, Field, StringConstraints, ValidationError

router = APIRouter(prefix="/api", tags=["realtime"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _errors_text(exc: ValidationError) -> str:
    """Pydantic's list of errors → one readable line to send back over the socket."""
    return "; ".join(f"{'.'.join(map(str, e['loc'])) or 'message'}: {e['msg']}" for e in exc.errors())


BINARY_NOT_ALLOWED = "Send JSON as text, not binary data."


async def receive_text_or_none(websocket: WebSocket) -> str | None:
    """The next message as text – or None when the browser sent BINARY data (a Blob or
    ArrayBuffer). websocket.receive_text() would crash on a binary message and drop the socket."""
    message = await websocket.receive()
    if message["type"] == "websocket.disconnect":
        raise WebSocketDisconnect(message.get("code", 1000), message.get("reason"))
    return message.get("text")


# =============================================================================
# 1. WebSocket – live training metrics   (/api/ws/training)
# =============================================================================
EPOCH_SECONDS = 0.15  # pause between epochs (the tests set it to 0)


class TrainingCommand(BaseModel):
    """{"action": "start", "epochs": 30, "learning_rate": 0.05}  or  {"action": "stop"}"""

    action: Literal["start", "stop"]
    epochs: int = Field(30, ge=5, le=200)
    learning_rate: float = Field(0.05, gt=0, le=1)


def simulate_epoch(epoch: int, lr: float, rng: random.Random) -> dict:
    """Believable fake metrics: a tiny learning rate learns slowly, a huge one bounces around,
    and training for too long makes the validation loss creep up again (overfitting)."""
    speed = 3 * min(lr, 0.4)
    learned = 1 - math.exp(-speed * epoch)  # 0 → 1 as training goes on
    past_best = max(0.0, epoch - 3 / speed)  # epochs since ~95 % was learned
    overfit = 0.25 * (1 - math.exp(-past_best / 40))  # grows once the model starts memorising
    wobble = max(0.0, lr - 0.4) * 1.6 * abs(math.sin(epoch * 1.9)) * rng.random()  # lr too big → unstable

    train_loss = max(0.03, 0.12 + 2.1 * (1 - learned) - overfit / 4 + wobble + rng.gauss(0, 0.015))
    val_loss = max(0.05, train_loss + 0.06 + overfit * 2 + rng.gauss(0, 0.025))
    train_acc = min(0.995, 0.35 + 0.62 * learned + overfit / 2 - wobble / 3 + rng.gauss(0, 0.006))
    val_acc = min(0.99, train_acc - 0.025 - overfit * 0.4 + rng.gauss(0, 0.01))
    return {
        "epoch": epoch,
        "train_loss": round(train_loss, 4),
        "val_loss": round(val_loss, 4),
        "train_acc": round(max(0.0, train_acc), 4),
        "val_acc": round(max(0.0, val_acc), 4),
    }


async def run_training(websocket: WebSocket, command: TrainingCommand) -> None:
    """Sends {"type": "epoch", ...} after every (pretend) epoch, then {"type": "done", ...}."""
    rng = random.Random(f"{command.epochs}-{command.learning_rate}")  # same settings → same curves
    await websocket.send_json({"type": "started", "epochs": command.epochs, "learning_rate": command.learning_rate})
    best: dict | None = None
    for epoch in range(1, command.epochs + 1):
        await asyncio.sleep(EPOCH_SECONDS)  # stand-in for a real epoch of work
        metrics = simulate_epoch(epoch, command.learning_rate, rng)
        if best is None or metrics["val_loss"] < best["val_loss"]:
            best = metrics
        await websocket.send_json({"type": "epoch", "epochs": command.epochs, **metrics})
    await websocket.send_json({"type": "done", "best": best})


async def stop_task(task: asyncio.Task | None) -> None:
    """Cancel a task and wait until it has really finished."""
    if task is None:
        return
    task.cancel()
    with suppress(asyncio.CancelledError, Exception):  # it may also have failed because the client left
        await task


@router.websocket("/ws/training")
async def training_socket(websocket: WebSocket) -> None:
    await websocket.accept()  # 1. complete the handshake – from now on both sides can send
    training: asyncio.Task | None = None
    try:
        await websocket.send_json({"type": "ready", "detail": 'Send {"action": "start"} to begin.'})
        while True:
            # 2. Wait for the next command. Training runs in its OWN task, so this loop can
            #    still receive "stop" while the epochs are streaming out.
            raw = await receive_text_or_none(websocket)
            if raw is None:
                await websocket.send_json({"type": "error", "detail": BINARY_NOT_ALLOWED})
                continue
            try:
                command = TrainingCommand.model_validate_json(raw)  # never trust what a client sends
            except ValidationError as exc:
                await websocket.send_json({"type": "error", "detail": _errors_text(exc)})
                continue

            if command.action == "start":
                await stop_task(training)  # one run at a time per connection
                training = asyncio.create_task(run_training(websocket, command))
            elif training is not None and not training.done():
                await stop_task(training)
                await websocket.send_json({"type": "stopped"})
            else:
                await websocket.send_json({"type": "error", "detail": "Nothing is training right now."})
    except WebSocketDisconnect:
        pass  # 3. the browser closed the tab or navigated away – completely normal
    finally:
        await stop_task(training)  # never keep working for a client that has gone


# =============================================================================
# 2. WebSocket – a chat room   (/api/ws/chat?name=Mia)
# =============================================================================
class ChatIn(BaseModel):
    """What a browser sends: {"text": "Hello!"}"""

    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class ConnectionManager:
    """Remembers every open chat socket, so one message can be sent to all of them (broadcast).

    It lives in this process's memory: with several server processes you would need a shared
    message broker (e.g. Redis pub/sub) so users on different processes can see each other."""

    def __init__(self) -> None:
        self.members: dict[WebSocket, str] = {}  # socket → nickname
        self.history: deque[dict] = deque(maxlen=20)  # recent messages for people who join later
        self._last_id = 0

    def event(self, kind: str, **fields) -> dict:
        self._last_id += 1
        return {"type": kind, "id": self._last_id, "time": _now_iso(), "online": len(self.members), **fields}

    def unique_name(self, wanted: str) -> str:
        taken = set(self.members.values())
        name, n = wanted, 2
        while name in taken:  # a second "Mia" becomes "Mia (2)"
            name, n = f"{wanted} ({n})", n + 1
        return name

    async def connect(self, websocket: WebSocket, wanted: str) -> str:
        await websocket.accept()
        name = self.unique_name(wanted)
        self.members[websocket] = name
        # Only the newcomer gets the welcome (with the history); everyone gets the "join".
        members = sorted(self.members.values())
        # If this send fails (the browser left during the handshake), the caller's `finally`
        # calls disconnect() – otherwise the name would stay "taken" until the server restarts.
        await websocket.send_json(self.event("welcome", you=name, members=members, history=list(self.history)))
        await self.broadcast(self.event("join", name=name))
        return name

    async def disconnect(self, websocket: WebSocket) -> None:
        name = self.members.pop(websocket, None)
        if name is not None:
            await self.broadcast(self.event("leave", name=name))

    async def broadcast(self, message: dict) -> None:
        self.history.append(message)
        for websocket in list(self.members):  # copy: the dict may change while we await
            with suppress(Exception):  # a vanished browser – its own handler will call disconnect()
                await websocket.send_json(message)


chat = ConnectionManager()


@router.websocket("/ws/chat")
async def chat_socket(
    websocket: WebSocket,
    # Query parameters of a WebSocket are validated too: a bad name is refused before accept()
    # (close code 1008 – the browser only sees the handshake fail with HTTP 403).
    name: Annotated[str, Query(min_length=1, max_length=20)],
) -> None:
    try:  # connect() is inside the try, so the `finally` cleans up even if joining fails half-way
        name = await chat.connect(websocket, name.strip() or "Anonymous")
        while True:
            raw = await receive_text_or_none(websocket)
            if raw is None:
                await websocket.send_json(chat.event("error", detail=BINARY_NOT_ALLOWED))
                continue
            try:
                incoming = ChatIn.model_validate_json(raw)
            except ValidationError as exc:  # tell only the sender what was wrong
                await websocket.send_json(chat.event("error", detail=_errors_text(exc)))
                continue
            await chat.broadcast(chat.event("message", name=name, text=incoming.text))
    except WebSocketDisconnect:
        pass
    finally:
        await chat.disconnect(websocket)  # announce "… left" to everyone else


# =============================================================================
# 3. Server-Sent Events – a live activity feed   (GET /api/stream/events)
# =============================================================================
HEARTBEAT_SECONDS = 5.0
# End every stream after this long. An endless response would block every server restart
# (`uvicorn --reload` waits for open responses first), freezing the WHOLE API until the tab is
# closed. EventSource reconnects by itself and sends Last-Event-ID, so the feed has no gap.
MAX_STREAM_SECONDS = 30.0
_streams: dict[str, asyncio.Event] = {}  # open streams: connection id → "please finish" flag

PEOPLE = ["Mia Chen", "Noah Patel", "Ava Nguyen", "Leo Rossi", "Zara Ahmed", "Kai Tanaka", "Ella Brown", "Omar Haddad"]
UNITS = ["COS30049", "COS30045", "COS20007", "SWE30003"]
TASKS = ["Assignment 1", "Assignment 2", "Assignment 3", "Quiz 4", "Lab 7"]
TOPICS = [
    "How do I enable CORS in FastAPI?",
    "Why does my useEffect run twice?",
    "Best chart for an imbalanced dataset?",
    "Deploying React + FastAPI together",
    "Which model for a regression task?",
]


class FeedEvent(BaseModel):
    kind: Literal["submission", "enrolment", "forum", "grade"]
    text: str
    unit: str
    time: str


def random_feed_event(rng: random.Random) -> FeedEvent:
    kind = rng.choice(["submission", "submission", "enrolment", "forum", "grade"])
    person, unit, task = rng.choice(PEOPLE), rng.choice(UNITS), rng.choice(TASKS)
    text = {
        "submission": f"{person} submitted {task}",
        "enrolment": f"{person} enrolled in {unit}",
        "forum": f"New forum post: “{rng.choice(TOPICS)}”",
        "grade": f"Marks released for {task}",
    }[kind]
    return FeedEvent(kind=kind, text=text, unit=unit, time=_now_iso())


# response_class=EventSourceResponse + `yield` = Server-Sent Events. FastAPI turns every
# ServerSentEvent into the text/event-stream format, sets "Cache-Control: no-cache", and sends
# a ": ping" comment by itself if we stay silent for 15 s (so proxies don't drop the connection).
@router.get("/stream/events", response_class=EventSourceResponse, summary="Live activity feed (Server-Sent Events)")
async def stream_events(
    last_event_id: Annotated[int | None, Header(description="Sent by EventSource automatically when it reconnects")] = None,
    limit: Annotated[int | None, Query(ge=1, le=1000, description="End after this many feed events (for tests/curl)")] = None,
    interval: Annotated[float, Query(ge=0.05, le=10, description="Average seconds between feed events")] = 1.5,
) -> AsyncIterable[ServerSentEvent]:
    """
    Each event on the wire is a few "field: value" lines followed by a blank line:

        event: submission
        data: {"kind":"submission","text":"Mia Chen submitted Assignment 2", …}
        id: 7

    When the stream breaks, the browser's EventSource reconnects by itself and sends the last
    id it saw in the `Last-Event-ID` header – so the server can carry on from there.
    A last "bye" event says why the stream ends: "dropped", "time-limit" or "limit".
    """
    connection_id = uuid.uuid4().hex[:8]
    finish = asyncio.Event()
    _streams[connection_id] = finish
    loop = asyncio.get_running_loop()
    rng = random.Random()
    next_id = (last_event_id or 0) + 1  # a real feed would also re-send the events that were missed
    sent = 0
    last_heartbeat = loop.time()
    ends_at = loop.time() + MAX_STREAM_SECONDS
    reason = "limit"
    try:
        # `retry` = how many ms EventSource waits before reconnecting after a break.
        hello = {"connection_id": connection_id, "resumed_after": last_event_id, "listeners": len(_streams)}
        yield ServerSentEvent(event="hello", data=hello, retry=2000)

        while limit is None or sent < limit:
            pause = interval * rng.uniform(0.4, 1.6)
            if loop.time() + pause > ends_at:  # old enough – see MAX_STREAM_SECONDS
                reason = "time-limit"
                break
            try:  # wait for the next event – or wake up early if someone asked this stream to finish
                await asyncio.wait_for(finish.wait(), timeout=pause)
                reason = "dropped"
                break
            except TimeoutError:
                pass
            feed = random_feed_event(rng)
            yield ServerSentEvent(event=feed.kind, id=str(next_id), data=feed)
            next_id, sent = next_id + 1, sent + 1

            if loop.time() - last_heartbeat >= HEARTBEAT_SECONDS:  # "still here" + how many are listening
                last_heartbeat = loop.time()
                yield ServerSentEvent(event="heartbeat", data={"time": _now_iso(), "listeners": len(_streams)})

        yield ServerSentEvent(event="bye", data={"reason": reason, "max_seconds": MAX_STREAM_SECONDS})
    finally:
        # Runs when the stream ends normally AND when the browser disconnects:
        # FastAPI then cancels this generator, so clean up here.
        _streams.pop(connection_id, None)


@router.post(
    "/stream/connections/{connection_id}/drop",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="End one event stream (to watch EventSource reconnect)",
    responses={404: {"description": "No open stream with this id"}},
)
async def drop_stream(connection_id: str) -> None:
    finish = _streams.get(connection_id)
    if finish is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"No open stream with id {connection_id}.")
    finish.set()  # the generator above wakes up, sends "bye" and ends → the HTTP response ends


# -----------------------------------------------------------------------------
# The same format BY HAND. EventSourceResponse only arrived in recent FastAPI versions; most
# tutorials (and older FastAPI) write the "field: value" lines themselves and wrap the generator
# in a StreamingResponse. Try it:  curl -N "http://localhost:8000/api/stream/countdown?start=5"
# -----------------------------------------------------------------------------
COUNTDOWN_SECONDS = 1.0  # pause between events (the tests set it to 0)


@router.get(
    "/stream/countdown",
    response_class=StreamingResponse,
    summary="Server-Sent Events by hand (StreamingResponse)",
    responses={200: {"description": "One event per second, then `done`", "content": {"text/event-stream": {}}}},
)
async def countdown(start: Annotated[int, Query(ge=1, le=10)] = 5) -> StreamingResponse:
    async def generate() -> AsyncIterator[str]:
        for n in range(start, 0, -1):
            # One event = "field: value" lines + an empty line. `data` must stay on ONE line → json.dumps.
            yield f"id: {n}\nevent: tick\ndata: {json.dumps({'seconds_left': n})}\n\n"
            await asyncio.sleep(COUNTDOWN_SECONDS)
        yield f"event: done\ndata: {json.dumps({'text': 'Submissions are now closed.'})}\n\n"

    # no-cache: nothing between server and browser may store the stream and replay it later.
    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
