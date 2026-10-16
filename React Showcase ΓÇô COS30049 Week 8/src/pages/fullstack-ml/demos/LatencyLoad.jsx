/**
 * LatencyLoad – fire N predictions AT THE SAME TIME, then the same N URLs as ONE batch.
 *
 * Promise.all starts every request before any has finished, so they really are
 * concurrent. We time each one in the browser (round trip) and also read the
 * server's own `latency_ms` – the gap between the two is network, proxy,
 * JSON and queueing, not the model.
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Zap } from 'lucide-react';
import { predictBatch, predictUrl } from './mlApi.js';
import { sampleRows, toCsv } from './sampleCsv.js';
import Histogram from './charts/Histogram.jsx';
import ApiErrorNote from './ApiErrorNote.jsx';
import { ms } from './charts/chartUtils.js';

const plural = (count) => (count === 1 ? '' : 's'); // "1 request", "2 requests"

export default function LatencyLoad() {
  const id = useId();
  const [n, setN] = useState(30);
  const [state, setState] = useState({ status: 'idle', run: null, error: null });
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function fire() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const options = { signal: controller.signal, timeout: 30000 };
    const urls = sampleRows(n, 11).map((r) => r.url);
    setState((s) => ({ ...s, status: 'running', error: null }));
    try {
      // 1) N single requests, all started at once.
      const started = performance.now();
      const singles = await Promise.all(urls.map(async (url) => {
        const t0 = performance.now();
        const result = await predictUrl(url, 0.5, options);
        return { roundTrip: performance.now() - t0, server: result.latency_ms };
      }));
      const singlesWall = performance.now() - started;

      // 2) The same URLs in ONE request: one HTTP round trip, one vectorised predict_proba call.
      const file = new File([toCsv(urls.map((url) => ({ url })), ['url'])], 'load-test.csv', { type: 'text/csv' });
      const b0 = performance.now();
      const batch = await predictBatch(file, 0.5, options);
      const batchWall = performance.now() - b0;

      setState({ status: 'done', error: null, run: { n, singles, singlesWall, batchWall, batchServer: batch.summary.latency_ms } });
    } catch (error) {
      if (!controller.signal.aborted) setState({ status: 'error', run: null, error });
    }
  }

  const { status, run, error } = state;
  const trips = run ? run.singles.map((s) => s.roundTrip).sort(d3.ascending) : [];
  const stats = run && {
    median: d3.quantileSorted(trips, 0.5),
    p95: d3.quantileSorted(trips, 0.95),
    max: trips[trips.length - 1],
    server: d3.median(run.singles, (s) => s.server),
    throughput: (run.n / run.singlesWall) * 1000,
  };
  const slowest = run ? Math.max(run.singlesWall, run.batchWall) : 1;
  // Always rendered, so screen readers hear each new result (errors come from ApiErrorNote's role="alert").
  const announcement = status === 'running' ? `Sending ${n} request${plural(n)} and one batch…`
    : run ? `Median round trip ${ms(stats.median)} over ${run.n} request${plural(run.n)}; the batch took ${ms(run.batchWall)}.` : '';

  return (
    <div className="stack">
      <div className="viz-controls">
        <label className="mlserve-slider" htmlFor={`${id}-n`}>
          <span className="small">Concurrent requests <strong>N = {n}</strong></span>
          <input id={`${id}-n`} type="range" min="1" max="100" value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <button type="button" className="btn btn-primary" onClick={fire} disabled={status === 'running'}>
          <Zap size={16} aria-hidden="true" /> {status === 'running' ? 'Running…' : `Fire ${n} request${plural(n)} + 1 batch`}
        </button>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
      {status === 'error' && <ApiErrorNote error={error} fillsIn={false} />}
      {!run && status !== 'error' && (
        <p className="small muted m-0">Press the button: the browser sends {n} POST /api/ml/predict request{plural(n)} at once, then one batch request.</p>
      )}

      {run && (
        <>
          <dl className="mlserve-tiles">
            <div><dt>Median round trip</dt><dd>{ms(stats.median)}</dd></div>
            <div><dt>95th percentile</dt><dd>{ms(stats.p95)}</dd></div>
            <div><dt>Slowest</dt><dd>{ms(stats.max)}</dd></div>
            <div><dt>Median model time</dt><dd>{ms(stats.server)}</dd></div>
            <div><dt>Throughput</dt><dd>{Math.round(stats.throughput)} req/s</dd></div>
          </dl>
          <Histogram values={trips} domain={[0, Math.max(1, stats.max * 1.05)]} bins={Math.min(24, Math.max(6, run.n))}
            format={(v) => `${Math.round(v)} ms`} xLabel="round-trip time per request" yLabel="requests"
            label={`Histogram of round-trip times for ${run.n} concurrent request${plural(run.n)}`} color="var(--chart-2)" />

          <figure className="mlserve-figure">
            <figcaption className="mlserve-figure-title">Same {run.n} URL{plural(run.n)}: total wall-clock time</figcaption>
            <div className="mlserve-compare">
              {[[`${run.n} single request${plural(run.n)}`, run.singlesWall], ['1 batch request', run.batchWall]].map(([label, time]) => (
                <div key={label} className="mlserve-compare-row">
                  <span className="mlserve-compare-label">{label}</span>
                  <span className="mlserve-compare-track"><span style={{ width: `${(time / slowest) * 100}%` }} /></span>
                  <strong>{ms(time)}</strong>
                </div>
              ))}
            </div>
            <p className="small muted m-0">
              {run.singlesWall / run.batchWall >= 1.1
                ? `The batch was ${(run.singlesWall / run.batchWall).toFixed(1)}× faster: one HTTP round trip and one vectorised predict_proba call (${ms(run.batchServer)} on the server) instead of ${run.n}.`
                : `With only ${run.n} URL${plural(run.n)}, uploading a file costs about as much as it saves – try N = 100.`}
            </p>
          </figure>
        </>
      )}
    </div>
  );
}
