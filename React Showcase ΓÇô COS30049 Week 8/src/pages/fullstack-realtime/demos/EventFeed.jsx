/**
 * EventFeed – Server-Sent Events with the browser's built-in EventSource.
 *
 * SSE is ONE-WAY (server → browser) over an ordinary HTTP response that never ends.
 * EventSource reconnects by itself: when the stream breaks it waits `retry` ms, reconnects and
 * sends the last id it received in a Last-Event-ID header. Press "Drop connection" to see it –
 * or just wait: the server ends every stream after 30 s, so a server restart never waits for it.
 */
import { useEffect, useState } from 'react';
import { Pause, Play, Unplug } from 'lucide-react';
import { api, API_BASE } from '../../../api/client.js';
import ConnectionPill from './ConnectionPill.jsx';
import { formatTime } from './format.js';

const KINDS = { submission: 'badge-primary', enrolment: 'badge-success', forum: 'badge-info', grade: 'badge-warning' };

export default function EventFeed() {
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [items, setItems] = useState([]); // newest first
  const [info, setInfo] = useState({ connectionId: null, listeners: null, beat: null });
  const [attempt, setAttempt] = useState(0); // +1 → the effect runs again → a brand-new EventSource
  const [error, setError] = useState(null);

  useEffect(() => {
    if (paused) return undefined;
    const source = new EventSource(`${API_BASE}/api/stream/events`);
    const add = (item) => setItems((list) => [item, ...list].slice(0, 40));
    let connectionId = '';
    let lastBye = null; // why the server ended the previous stream ("dropped", "time-limit" …)
    let retryTimer;

    source.onopen = () => setStatus('open');
    source.onerror = () => {
      setStatus('reconnecting');
      // CONNECTING = the browser is already retrying by itself. CLOSED = it gave up, which happens
      // after an HTTP error (e.g. the 500 the Vite proxy sends while FastAPI is down).
      // EventSource never retries after that, so we start a new one ourselves in 3 s.
      if (source.readyState === EventSource.CLOSED) retryTimer = setTimeout(() => setAttempt((n) => n + 1), 3000);
    };

    // Named events ("event: submission") need addEventListener – onmessage only gets unnamed ones.
    source.addEventListener('hello', (event) => {
      const hello = JSON.parse(event.data);
      connectionId = hello.connection_id; // a new id for every HTTP connection, including reconnects
      setInfo((old) => ({ ...old, connectionId, listeners: hello.listeners }));
      if (hello.resumed_after !== null) {
        const why = lastBye?.reason === 'time-limit'
          ? `The server ends every stream after ${lastBye.max_seconds} s, so a server restart never waits for it. `
          : '';
        add({ key: `resume-${connectionId}`, notice: `${why}EventSource reconnected by itself and sent Last-Event-ID: ${hello.resumed_after} – the ids carry on.` });
        lastBye = null;
      }
    });
    // The server's last event before it ends a stream says why.
    source.addEventListener('bye', (event) => {
      lastBye = JSON.parse(event.data);
    });
    source.addEventListener('heartbeat', (event) => {
      const beat = JSON.parse(event.data);
      setInfo((old) => ({ ...old, listeners: beat.listeners, beat: beat.time }));
    });
    for (const kind of Object.keys(KINDS)) {
      source.addEventListener(kind, (event) => {
        add({ key: `${connectionId}-${event.lastEventId}`, id: event.lastEventId, ...JSON.parse(event.data) });
      });
    }

    return () => {
      clearTimeout(retryTimer);
      source.close(); // the server notices, and its `finally` block cleans up
    };
  }, [paused, attempt]);

  function togglePause() {
    setStatus(paused ? 'connecting' : 'paused');
    setItems((list) => [{ key: `pause-${Date.now()}`, notice: paused ? 'Resumed with a new connection – ids start again.' : 'Paused: EventSource closed the connection.' }, ...list]);
    setPaused(!paused);
  }

  async function drop() {
    setError(null);
    try {
      await api.post(`/api/stream/connections/${info.connectionId}/drop`); // the server ends our stream
      const notice = `The server ended stream #${info.connectionId}. EventSource will reconnect by itself in ~2 s (the “retry: 2000” the server sent).`;
      setItems((list) => [{ key: `drop-${info.connectionId}`, notice }, ...list]);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <div className="row-between">
        <span className="row" style={{ gap: 8 }}>
          <ConnectionPill status={status} />
          {info.connectionId && status === 'open' && (
            <span className="rt-note">
              stream <span className="mono">#{info.connectionId}</span> · {info.listeners} listening
              {info.beat && <> · <span className="rt-beat" key={info.beat} aria-hidden="true" /> heartbeat {formatTime(info.beat)}</>}
            </span>
          )}
        </span>
        <span className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn-sm" onClick={togglePause}>
            {paused ? <><Play size={14} aria-hidden="true" /> Resume</> : <><Pause size={14} aria-hidden="true" /> Pause</>}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={drop} disabled={status !== 'open'}>
            <Unplug size={14} aria-hidden="true" /> Drop connection
          </button>
        </span>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}

      {/* A new event arrives every ~1.5 s – far too often to read aloud, so the feed is NOT a live
          region. Screen readers only hear the newest notice (drop, reconnect, pause) from this line. */}
      <p className="visually-hidden" role="status">{items.find((item) => item.notice)?.notice ?? ''}</p>
      <ul className="rt-feed" aria-label="Live campus activity">
        {items.length === 0 && (
          <li className="rt-feed-empty">
            {status === 'reconnecting' ? 'Can’t reach the stream – start the back end (see the banner above).' : 'Waiting for the first event…'}
          </li>
        )}
        {items.map((item) =>
          item.notice ? (
            <li key={item.key} className="rt-feed-notice">{item.notice}</li>
          ) : (
            <li key={item.key}>
              <span className={`badge ${KINDS[item.kind]}`}>{item.kind}</span>
              <span>{item.text} <span className="badge badge-code">{item.unit}</span></span>
              <span className="rt-feed-meta">#{item.id} · {formatTime(item.time)}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
