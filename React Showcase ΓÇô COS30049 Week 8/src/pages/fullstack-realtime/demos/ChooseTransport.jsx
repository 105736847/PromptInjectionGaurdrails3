/**
 * ChooseTransport – polling vs Server-Sent Events vs WebSocket, side by side.
 * Say what your feature needs and the matching column lights up.
 */
import { useRef, useState } from 'react';

const COLUMNS = [
  { id: 'polling', title: 'Polling', need: 'The browser checks now and then (“is it done yet?”)' },
  { id: 'sse', title: 'Server-Sent Events', need: 'The server keeps sending updates; the browser only listens' },
  { id: 'ws', title: 'WebSocket', need: 'Both sides send messages at any moment' },
];

const ROWS = [
  ['Direction', 'Browser asks, server answers – again and again', 'Server → browser only', 'Both ways, at any time'],
  ['Protocol', 'Ordinary HTTP requests', 'One HTTP response that never ends (text/event-stream)', 'Starts as HTTP, then “upgrades” to ws://'],
  ['Reconnection', 'Nothing to reconnect – the next request simply tries again', 'Automatic: EventSource retries and sends Last-Event-ID', 'Not built in – write it yourself (useWebSocket.js)'],
  ['In the browser', 'fetch() + setTimeout', 'new EventSource(url)', 'new WebSocket(url)'],
  ['In FastAPI', 'Normal endpoints (202 + a job id)', 'EventSourceResponse + yield (or a StreamingResponse you format by hand)', '@router.websocket + await receive / send'],
  ['Cost', 'A request every interval, even when nothing changed', 'One open connection per tab (over HTTP/1.1 a browser allows only about 6 per domain, shared by every tab)', 'One open connection that you must look after'],
  ['Use it for', 'Job progress, “is my report ready?”', 'Live feeds, notifications, streamed progress or AI text', 'Chat, multiplayer, live controls (start/stop training)'],
];

export default function ChooseTransport() {
  const [pick, setPick] = useState('polling');
  const wrapRef = useRef(null); // the scrolling box around the table
  const headRefs = useRef({}); // column id → its <th>

  function choose(id) {
    setPick(id);
    // On a phone the table scrolls sideways – bring the chosen column into view.
    const wrap = wrapRef.current;
    const th = headRefs.current[id];
    if (wrap && th && wrap.scrollWidth > wrap.clientWidth) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      wrap.scrollTo({ left: th.offsetLeft - (wrap.clientWidth - th.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  return (
    <div className="stack">
      <fieldset>
        <legend>What does your feature need?</legend>
        <div className="stack-sm">
          {COLUMNS.map((c) => (
            <label key={c.id} className="check">
              <input type="radio" name="rt-transport" value={c.id} checked={pick === c.id} onChange={() => choose(c.id)} />
              {/* one element, so the label wraps as one sentence (.check is a flex row) */}
              <span>{c.need} → <strong>{c.title}</strong></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="table-wrap" ref={wrapRef}>
        <table className="table rt-compare">
          <thead>
            <tr>
              <th scope="col"><span className="visually-hidden">Aspect</span></th>
              {COLUMNS.map((c) => (
                <th key={c.id} scope="col" className={pick === c.id ? 'is-pick' : undefined} ref={(node) => { headRefs.current[c.id] = node; }}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, ...cells]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {cells.map((cell, i) => <td key={COLUMNS[i].id} className={pick === COLUMNS[i].id ? 'is-pick' : undefined}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rt-note">
        <strong>For Assignment 3:</strong> a normal <code>fetch</code> request is all a prediction needs. If something takes
        longer than a few seconds (e.g. retraining), start a job and <strong>poll</strong> it – or stream its progress with{' '}
        <strong>SSE</strong>. Use a <strong>WebSocket</strong> only when the user and the server really talk back and forth.
      </p>
    </div>
  );
}
