/**
 * ParallelRequests – three independent requests, sent two ways:
 *
 *   one after another:  for (…) await api.get(…)        → total ≈ 3 × delay
 *   all at once:        await Promise.all([...])        → total ≈ 1 × delay
 *
 * The server can overlap them because `slow` is an async def that awaits
 * asyncio.sleep – while one request sleeps, uvicorn serves the others.
 */
import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';

import { api } from '../../../api/client.js';

const COUNT = 3;

export default function ParallelRequests() {
  const [seconds, setSeconds] = useState(1);
  const [runs, setRuns] = useState(null); // { sequential: {bars, total}, parallel: {…} }
  const [phase, setPhase] = useState('idle'); // 'idle' | 'sequential' | 'parallel'
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function handleRun() {
    const controller = new AbortController();
    controllerRef.current = controller;
    // One timed request: when did it start / end, relative to `t0`?
    // Each request gets its own URL (&n=1, 2, 3): browsers hold back IDENTICAL GET
    // requests that are in flight at the same time, hoping to reuse the first answer
    // from their cache – that would secretly turn Promise.all into "one after another".
    const timed = async (t0, n) => {
      const start = performance.now() - t0;
      await api.get(`/api/basics/slow?seconds=${seconds}&n=${n}`, { signal: controller.signal });
      return { start, end: performance.now() - t0 };
    };
    setError(null);
    setRuns(null);
    try {
      setPhase('sequential');
      let t0 = performance.now();
      const sequentialBars = [];
      for (let n = 1; n <= COUNT; n += 1) sequentialBars.push(await timed(t0, n)); // waits each time
      const sequential = { bars: sequentialBars, total: performance.now() - t0 };

      setPhase('parallel');
      t0 = performance.now();
      const parallelBars = await Promise.all(Array.from({ length: COUNT }, (_, i) => timed(t0, i + 1))); // starts all 3
      const parallel = { bars: parallelBars, total: performance.now() - t0 };
      setRuns({ sequential, parallel });
    } catch (err) {
      if (!controller.signal.aborted) setError(err);
    } finally {
      if (!controller.signal.aborted) setPhase('idle');
    }
  }

  const scale = runs ? Math.max(runs.sequential.total, runs.parallel.total) : 1;
  const formatSeconds = (ms) => `${(ms / 1000).toFixed(2)} s`;
  // What a screen reader hears – the live region below is always rendered, only its text changes.
  const status = phase === 'sequential' ? 'One after another…'
    : phase === 'parallel' ? 'All at once…'
      : runs ? `Done. One after another took ${formatSeconds(runs.sequential.total)}, all at once ${formatSeconds(runs.parallel.total)}.` : '';

  return (
    <div className="stack">
      <div className="row">
        <label className="fastapi-inline-field">
          Each request takes
          <select className="input fastapi-input-sm" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} disabled={phase !== 'idle'}>
            {[0.5, 1, 1.5].map((s) => <option key={s} value={s}>{s} s</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={handleRun} disabled={phase !== 'idle'}>
          <Zap size={16} aria-hidden="true" /> Run the comparison
        </button>
        <span className="row small muted" role="status">
          {phase !== 'idle' && <span className="spinner" aria-hidden="true" />}
          <span className={phase === 'idle' ? 'visually-hidden' : undefined}>{status}</span>
        </span>
      </div>
      {error && (
        <p className="alert alert-warning m-0" role="alert">
          {error.message}{error.isOffline ? ' Start the back end – see the banner above.' : ''}
        </p>
      )}

      {runs && (
        <div className="stack">
          {[
            ['sequential', 'One after another (await in a loop)'],
            ['parallel', 'All at once (Promise.all)'],
          ].map(([id, label]) => (
            <figure key={id} className="fastapi-gantt m-0">
              <figcaption className="row-between small">
                <strong>{label}</strong>
                <span className="mono">total {formatSeconds(runs[id].total)}</span>
              </figcaption>
              {runs[id].bars.map((bar, i) => (
                <div key={i} className="fastapi-gantt-row">
                  <span className="small muted">
                    #{i + 1}
                    {/* The bars are only drawn – this text says the same thing to screen readers. */}
                    <span className="visually-hidden">: from {Math.round(bar.start)} to {Math.round(bar.end)} ms</span>
                  </span>
                  <div className="fastapi-gantt-track">
                    <div
                      className="fastapi-gantt-bar"
                      data-kind={id}
                      style={{ left: `${(bar.start / scale) * 100}%`, width: `${((bar.end - bar.start) / scale) * 100}%` }}
                      title={`${Math.round(bar.start)}–${Math.round(bar.end)} ms`}
                    />
                  </div>
                </div>
              ))}
            </figure>
          ))}
          <p className="small muted m-0">
            Use <code>Promise.all</code> only when the requests don’t depend on each other. It rejects as soon as one
            fails – use <code>Promise.allSettled</code> if you want every result, failed or not.
          </p>
        </div>
      )}
    </div>
  );
}
