"""Tests for app/routers/realtime.py – two WebSockets and the Server-Sent Events stream."""
import asyncio
import json
import threading
import time
from contextlib import suppress

import pytest
from fastapi.websockets import WebSocketDisconnect

from app.routers import realtime


@pytest.fixture(autouse=True)
def fast_epochs(monkeypatch):
    monkeypatch.setattr(realtime, "EPOCH_SECONDS", 0)


# ---------- /api/ws/training ----------------------------------------------------
def test_training_streams_every_epoch_then_done(client):
    with client.websocket_connect("/api/ws/training") as ws:
        assert ws.receive_json()["type"] == "ready"
        ws.send_json({"action": "start", "epochs": 6, "learning_rate": 0.1})
        assert ws.receive_json() == {"type": "started", "epochs": 6, "learning_rate": 0.1}

        epochs = [ws.receive_json() for _ in range(6)]
        assert [m["epoch"] for m in epochs] == [1, 2, 3, 4, 5, 6]
        assert all(m["type"] == "epoch" and 0 <= m["val_acc"] <= 1 for m in epochs)
        assert epochs[-1]["train_loss"] < epochs[0]["train_loss"]  # it "learns"

        done = ws.receive_json()
        assert done["type"] == "done" and 1 <= done["best"]["epoch"] <= 6


def test_training_can_be_stopped(client, monkeypatch):
    monkeypatch.setattr(realtime, "EPOCH_SECONDS", 0.02)
    with client.websocket_connect("/api/ws/training") as ws:
        ws.receive_json()  # ready
        ws.send_json({"action": "start", "epochs": 200})
        ws.receive_json()  # started
        ws.receive_json()  # epoch 1
        ws.send_json({"action": "stop"})
        messages = []
        while (message := ws.receive_json())["type"] != "stopped":
            messages.append(message)
        assert len(messages) < 199


def test_training_stops_when_the_client_leaves(client, monkeypatch):
    monkeypatch.setattr(realtime, "EPOCH_SECONDS", 0.02)
    outcome, finished = {}, threading.Event()
    real_run = realtime.run_training

    async def watched_run(websocket, command):  # the real training, plus a note of how it ended
        try:
            await real_run(websocket, command)
            outcome["result"] = "completed"
        except asyncio.CancelledError:
            outcome["result"] = "cancelled"
            raise
        finally:
            finished.set()

    monkeypatch.setattr(realtime, "run_training", watched_run)
    with client.websocket_connect("/api/ws/training") as ws:
        ws.receive_json()  # ready
        ws.send_json({"action": "start", "epochs": 200})  # 200 × 0.02 s = 4 s of work
        ws.receive_json(), ws.receive_json()  # started, epoch 1
    # Leaving the `with` block closes the socket → the handler's `finally` cancels the task.
    assert finished.wait(timeout=2)
    assert outcome["result"] == "cancelled"


def test_binary_frames_get_an_error_instead_of_a_crash(client):
    with client.websocket_connect("/api/ws/training") as ws:
        ws.receive_json()  # ready
        ws.send_bytes(b'{"action": "start"}')
        assert ws.receive_json() == {"type": "error", "detail": realtime.BINARY_NOT_ALLOWED}
        ws.send_json({"action": "stop"})  # the socket is still alive
        assert ws.receive_json()["detail"] == "Nothing is training right now."

    with client.websocket_connect("/api/ws/chat?name=Bin") as ws:
        ws.receive_json(), ws.receive_json()  # welcome, join
        ws.send_bytes(b"hello")
        error = ws.receive_json()
        assert (error["type"], error["detail"]) == ("error", realtime.BINARY_NOT_ALLOWED)


def test_training_rejects_bad_commands(client):
    with client.websocket_connect("/api/ws/training") as ws:
        ws.receive_json()  # ready
        ws.send_json({"action": "start", "epochs": 1})
        assert "epochs" in ws.receive_json()["detail"]
        ws.send_text("this is not JSON")
        assert ws.receive_json()["type"] == "error"
        ws.send_json({"action": "stop"})
        assert ws.receive_json() == {"type": "error", "detail": "Nothing is training right now."}


# ---------- /api/ws/chat ----------------------------------------------------------
def test_chat_broadcasts_join_message_and_leave(client):
    with client.websocket_connect("/api/ws/chat?name=Ana") as ana:
        welcome = ana.receive_json()
        assert welcome["type"] == "welcome" and welcome["you"] == "Ana" and welcome["online"] == 1
        assert ana.receive_json()["type"] == "join"  # everyone (including Ana) hears about Ana

        with client.websocket_connect("/api/ws/chat?name=Ana") as second:
            welcome2 = second.receive_json()
            assert welcome2["you"] == "Ana (2)"  # names stay unique
            assert welcome2["members"] == ["Ana", "Ana (2)"]
            joined = ana.receive_json()
            assert (joined["type"], joined["name"], joined["online"]) == ("join", "Ana (2)", 2)
            second.receive_json()  # its own join

            second.send_json({"text": "  Hi everyone!  "})
            for socket in (ana, second):
                message = socket.receive_json()
                assert (message["type"], message["name"], message["text"]) == ("message", "Ana (2)", "Hi everyone!")

            second.send_json({"text": "   "})
            assert second.receive_json()["type"] == "error"  # only the sender hears about it

        left = ana.receive_json()
        assert (left["type"], left["name"], left["online"]) == ("leave", "Ana (2)", 1)


def test_chat_history_is_sent_to_newcomers(client):
    with client.websocket_connect("/api/ws/chat?name=Ben") as ben:
        ben.receive_json(), ben.receive_json()
        ben.send_json({"text": "Anyone there?"})
        ben.receive_json()
        with client.websocket_connect("/api/ws/chat?name=Cai") as cai:
            history = cai.receive_json()["history"]
            assert any(m.get("text") == "Anyone there?" for m in history)


def test_chat_forgets_a_member_whose_welcome_could_not_be_sent(monkeypatch):
    class LeavesDuringHandshake:  # a stand-in WebSocket: the browser is gone before the welcome
        async def accept(self):
            pass

        async def send_json(self, data):
            raise WebSocketDisconnect(1006)

    room = realtime.ConnectionManager()
    monkeypatch.setattr(realtime, "chat", room)
    asyncio.run(realtime.chat_socket(LeavesDuringHandshake(), name="Mia"))
    assert room.members == {}  # otherwise "Mia" would stay online – and taken – forever


def test_chat_rejects_a_bad_name(client):
    with pytest.raises(WebSocketDisconnect) as closed:
        with client.websocket_connect("/api/ws/chat?name=" + "x" * 21) as ws:
            ws.receive_json()
    assert closed.value.code == 1008  # policy violation


# ---------- /api/stream/events (Server-Sent Events) --------------------------------
def parse_sse(text: str) -> list[dict]:
    """Split the text/event-stream body into events: {"event": …, "data": …, "id": …}."""
    events = []
    for block in text.strip().split("\n\n"):
        fields = dict(line.split(": ", 1) for line in block.splitlines() if not line.startswith(":"))
        if "data" in fields:
            fields["data"] = json.loads(fields["data"])
        events.append(fields)
    return events


def test_sse_stream_sends_named_events_with_ids(client):
    response = client.get("/api/stream/events?limit=3&interval=0.05")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.headers["cache-control"] == "no-cache"

    hello, *feed, bye = parse_sse(response.text)
    assert hello["event"] == "hello" and hello["retry"] == "2000"
    assert hello["data"]["resumed_after"] is None
    assert [e["id"] for e in feed] == ["1", "2", "3"]
    assert all(e["event"] == e["data"]["kind"] for e in feed)
    assert bye["event"] == "bye" and bye["data"]["reason"] == "limit"
    assert realtime._streams == {}  # the stream cleaned up after itself


def test_sse_resumes_after_last_event_id(client):
    response = client.get("/api/stream/events?limit=2&interval=0.05", headers={"Last-Event-ID": "41"})
    hello, *feed, _bye = parse_sse(response.text)
    assert hello["data"]["resumed_after"] == 41
    assert [e["id"] for e in feed] == ["42", "43"]


def test_sse_heartbeat(client, monkeypatch):
    monkeypatch.setattr(realtime, "HEARTBEAT_SECONDS", 0)
    events = parse_sse(client.get("/api/stream/events?limit=2&interval=0.05").text)
    heartbeats = [e for e in events if e["event"] == "heartbeat"]
    assert heartbeats and heartbeats[0]["data"]["listeners"] == 1


def test_sse_drop_ends_an_open_stream(client):
    result = {}
    reader = threading.Thread(
        target=lambda: result.update(response=client.get("/api/stream/events?interval=0.05")), daemon=True
    )
    reader.start()  # an endless stream – it only ends because we drop it below
    for _ in range(200):
        if realtime._streams:
            break
        time.sleep(0.01)
    connection_id = next(iter(realtime._streams))

    assert client.post(f"/api/stream/connections/{connection_id}/drop").status_code == 204
    reader.join(timeout=5)
    assert not reader.is_alive()
    assert result["response"].status_code == 200
    assert parse_sse(result["response"].text)[-1]["data"]["reason"] == "dropped"
    assert client.post(f"/api/stream/connections/{connection_id}/drop").status_code == 404


def test_sse_stream_ends_by_itself_after_max_seconds(client, monkeypatch):
    # An endless stream would hold up every restart of `uvicorn --reload` – so it ends itself.
    monkeypatch.setattr(realtime, "MAX_STREAM_SECONDS", 0.3)
    started = time.monotonic()
    events = parse_sse(client.get("/api/stream/events?interval=0.05").text)  # no ?limit= → "endless"
    assert time.monotonic() - started < 3
    assert events[-1]["event"] == "bye" and events[-1]["data"]["reason"] == "time-limit"
    assert realtime._streams == {}


def test_sse_cleans_up_when_the_client_disconnects():
    # When the browser goes away, Starlette CANCELS the task that runs the generator.
    async def open_then_leave():
        stream = realtime.stream_events(last_event_id=None, limit=None, interval=0.05)

        async def read_forever():
            async for _ in stream:
                pass

        reader = asyncio.create_task(read_forever())
        await asyncio.sleep(0.2)
        assert len(realtime._streams) == 1  # open and registered
        reader.cancel()  # = the client disconnected
        with suppress(asyncio.CancelledError):
            await reader

    asyncio.run(open_then_leave())
    assert realtime._streams == {}  # the generator's `finally` ran


def test_countdown_writes_sse_by_hand(client, monkeypatch):
    monkeypatch.setattr(realtime, "COUNTDOWN_SECONDS", 0)
    response = client.get("/api/stream/countdown?start=3")
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.headers["cache-control"] == "no-cache"
    events = parse_sse(response.text)
    assert [(e.get("id"), e["event"]) for e in events] == [("3", "tick"), ("2", "tick"), ("1", "tick"), (None, "done")]
    assert events[0]["data"] == {"seconds_left": 3}
    assert client.get("/api/stream/countdown?start=11").status_code == 422


def test_sse_rejects_bad_parameters(client):
    assert client.get("/api/stream/events?limit=0").status_code == 422
    assert client.get("/api/stream/events?interval=0").status_code == 422
