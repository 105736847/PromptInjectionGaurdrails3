/**
 * TimeoutCancel – three ways a slow request can end:
 *   1. the server answers in time            → success
 *   2. the client stops waiting (timeout)    → client.js throws "took longer than…"
 *   3. the user presses Cancel               → controller.abort()
 *
 * The server (async def slow) notices when the browser hangs up and stops early –
 * compare its "finished" and "stopped early" counters after each try.
 */
import { useEffect, useRef, useState } from 'react';
import { Ban, Play } from 'lucide-react';

import { api } from '../../../api/client.js';

const SCALE_S = 10; // the track below shows 0–10 seconds
const OUTCOME_LABELS = { success: 'Answered in time', timeout: 'Timed out', cancel: 'Cancelled', error: 'Failed' };

export default function TimeoutCancel() {
  const [serverSeconds, setServerSeconds] = useState(3);
  const [timeoutSeconds, setTimeoutSeconds] = useState(5);
  const [elapsed, setElapsed] = useState(0); // ms, updated every animation frame
  const [outcome, setOutcome] = useState(null); // { kind, text }
  const [stats, setStats] = useState(null);
  const [running, setRunning] = useState(false);
  const controllerRef = useRef(null); // the AbortController of the request in flight
  const frameRef = useRef(0);

  // Cleanup on unmount: abort the request and stop the timer loop.
  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null; // tells handleSend() "the component is gone"
    cancelAnimationFrame(frameRef.current);
  }, []);

  async function refreshStats() {
    try {
      setStats(await api.get('/api/basics/slow/stats'));
    } catch {
      setStats(null); // offline – the message above already explains it
    }
  }

  async function handleSend() {
    const controller = new AbortController();
    controllerRef.current = controller;
    setOutcome(null);
    setRunning(true);
    const started = performance.now();
    const tick = () => {
      setElapsed(performance.now() - started);
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();

    let result;
    try {
      const data = await api.get(`/api/basics/slow?seconds=${serverSeconds}`, { timeout: timeoutSeconds * 1000, signal: controller.signal });
      result = { kind: 'success', text: `Answered after ${data.waited_seconds} s.` };
    } catch (error) {
      const ms = performance.now() - started;
      if (controller.signal.aborted) result = { kind: 'cancel', text: `You cancelled after ${(ms / 1000).toFixed(1)} s.` };
      // client.js uses status 0 for BOTH "offline" and "timeout" – the elapsed time tells them apart.
      else if (error.status === 0 && ms >= timeoutSeconds * 1000 - 50) result = { kind: 'timeout', text: error.message };
      else result = { kind: 'error', text: `${error.message}${error.isOffline ? ' Start the back end – see the banner above.' : ''}` };
    }
    cancelAnimationFrame(frameRef.current);
    if (controllerRef.current !== controller) return; // unmounted meanwhile
    setElapsed(performance.now() - started);
    setOutcome(result);
    setRunning(false);
    // Give the server a moment to notice the hang-up, then read its counters.
    setTimeout(() => controllerRef.current === controller && refreshStats(), 400);
  }

  const pct = (seconds) => `${Math.min(100, (seconds / SCALE_S) * 100)}%`;

  return (
    <div className="stack">
      <div className="grid-2">
        <label className="field">
          <span className="label">Server takes: {serverSeconds} s</span>
          <input type="range" min="0" max="8" step="0.5" value={serverSeconds} onChange={(e) => setServerSeconds(Number(e.target.value))} disabled={running} />
        </label>
        <label className="field">
          <span className="label">Client timeout: {timeoutSeconds} s</span>
          <input type="range" min="0.5" max="10" step="0.5" value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(Number(e.target.value))} disabled={running} />
        </label>
      </div>

      <div className="fastapi-track" role="img" aria-label={`Elapsed ${(elapsed / 1000).toFixed(1)} of 10 seconds`}>
        <div className="fastapi-track-fill" data-kind={outcome?.kind} style={{ width: pct(elapsed / 1000) }} />
        <span className="fastapi-track-mark fastapi-track-server" style={{ left: pct(serverSeconds) }}>server</span>
        <span className="fastapi-track-mark fastapi-track-timeout" style={{ left: pct(timeoutSeconds) }}>timeout</span>
      </div>

      <div className="row">
        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={running}>
          <Play size={16} aria-hidden="true" /> Send
        </button>
        <button type="button" className="btn btn-danger" onClick={() => controllerRef.current?.abort()} disabled={!running}>
          <Ban size={16} aria-hidden="true" /> Cancel
        </button>
        <span className="mono small">{(elapsed / 1000).toFixed(1)} s</span>
      </div>

      <div aria-live="polite">
        {outcome && (
          <p className={`alert m-0 ${outcome.kind === 'success' ? 'alert-success' : 'alert-warning'}`}>
            <span><strong>{OUTCOME_LABELS[outcome.kind]}:</strong> {outcome.text}</span>
          </p>
        )}
        {stats && (
          <p className="small muted mt-1 m-0">
            Server counters since uvicorn last (re)started: <strong>{stats.completed}</strong> finished ·{' '}
            <strong>{stats.stopped_early}</strong> stopped early because the browser hung up.
          </p>
        )}
      </div>
    </div>
  );
}
