/**
 * RetryBackoff – try again when the server is TEMPORARILY unavailable,
 * waiting longer after each failure (exponential backoff: 0.5 s, 1 s, 2 s…).
 *
 * GET /api/basics/flaky answers 503 for the first N calls with the same `key`,
 * then 200. Only retry errors that can go away by themselves (network, 5xx, 429);
 * a 400/401/404/422 will fail again in exactly the same way, so don't retry those.
 */
import { useEffect, useRef, useState } from 'react';
import { Ban, RotateCcw } from 'lucide-react';

import { api } from '../../../api/client.js';

const BASE_DELAY_MS = 500;
const isRetryable = (error) => error.status === 0 || error.status === 429 || error.status >= 500;

/** A setTimeout you can cancel with the same AbortSignal as the request. */
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Reusable: call request() up to maxAttempts times. onEvent reports progress to the UI. */
async function withRetry(request, { maxAttempts, signal, onEvent }) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const data = await request();
      onEvent({ attempt, ok: true, text: `200 – ${data.message}` });
      return data;
    } catch (error) {
      if (signal.aborted) throw error;
      const last = attempt >= maxAttempts || !isRetryable(error);
      onEvent({ attempt, ok: false, text: `${error.status || 'network'} – ${error.message}` });
      if (last) throw error;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1); // 500, 1000, 2000 …
      onEvent({ waiting: delay, text: `waiting ${delay} ms before attempt ${attempt + 1}…` });
      await wait(delay, signal);
    }
  }
}

export default function RetryBackoff() {
  const [failTimes, setFailTimes] = useState(2);
  const [maxAttempts, setMaxAttempts] = useState(4);
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []); // stop retrying on unmount

  async function handleRun() {
    const controller = new AbortController();
    controllerRef.current = controller;
    const key = Math.random().toString(36).slice(2); // a fresh counter on the server
    const started = performance.now();
    const log = (event) => setEvents((list) => [...list, { ...event, at: Math.round(performance.now() - started) }]);
    setEvents([]);
    setRunning(true);
    try {
      const path = `/api/basics/flaky?key=${key}&fail_times=${failTimes}`;
      await withRetry(() => api.get(path, { signal: controller.signal }), { maxAttempts, signal: controller.signal, onEvent: log });
      log({ done: true, ok: true, text: 'Success – the user never noticed the hiccups.' });
    } catch (error) {
      const hint = error.isOffline ? ' Start the back end – see the banner above.' : '';
      if (controller.signal.aborted) log({ done: true, text: 'Cancelled.' });
      else log({ done: true, text: `Gave up: show an error with a “Try again” button. (${error.message})${hint}` });
    } finally {
      if (controllerRef.current === controller) setRunning(false);
    }
  }

  return (
    <div className="stack">
      <div className="row fastapi-controls">
        <label className="field">
          <span className="label">Server fails the first</span>
          <select className="input" value={failTimes} onChange={(e) => setFailTimes(Number(e.target.value))} disabled={running}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} call{n === 1 ? '' : 's'}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="label">Max attempts</span>
          <select className="input" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} disabled={running}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={handleRun} disabled={running}>
            <RotateCcw size={16} aria-hidden="true" /> Run with retries
          </button>
          <button type="button" className="btn" onClick={() => controllerRef.current?.abort()} disabled={!running}>
            <Ban size={16} aria-hidden="true" /> Cancel
          </button>
        </div>
      </div>

      <ol className="fastapi-timeline" aria-live="polite">
        {events.map((event, i) => (
          <li key={i} data-kind={event.waiting ? 'wait' : event.ok ? 'ok' : 'fail'} className={event.done ? 'is-done' : undefined}>
            <span className="mono small subtle">+{event.at} ms</span>
            <span>{event.attempt && <strong>Attempt {event.attempt}: </strong>}{event.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
