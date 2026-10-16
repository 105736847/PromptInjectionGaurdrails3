/**
 * PredictOne – send one URL to POST /api/ml/predict and show the answer.
 *
 * Teaches: a controlled input, a DEBOUNCED effect ("predict as you type"),
 * cancelling stale requests (usePrediction.js), showing FastAPI's 422
 * validation message next to the field, and showing a PROBABILITY (the gauge)
 * instead of only a yes/no label.
 */
import { useEffect, useId, useState } from 'react';
import { Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import useBackendStatus from '../../../hooks/useBackendStatus.js';
import useApiGet from './useApiGet.js';
import usePrediction from './usePrediction.js';
import { getExamples } from './mlApi.js';
import ProbabilityGauge from './charts/ProbabilityGauge.jsx';
import ApiErrorNote from './ApiErrorNote.jsx';
import { ms, pct0, probability } from './charts/chartUtils.js';

const FIRST_URL = 'http://203.0.113.45/brightwater-uni/verify-account';
const DEBOUNCE_MS = 300;
const plural = (count) => (count === 1 ? '' : 's'); // "1 request", "2 requests"
// Invalid on purpose: the SERVER's Pydantic model rejects them with 422.
const INVALID = [
  { label: 'Empty URL', url: '' },
  { label: 'URL with a space', url: 'https://www.brightwater-uni.example/my courses' },
  { label: '2,100 characters', url: `https://a.example/${'x'.repeat(2082)}` },
];

export default function PredictOne() {
  const id = useId();
  const { status } = useBackendStatus();
  const examples = useApiGet(getExamples);
  const { result, error, loading, roundTripMs, sent, cancelled, predict } = usePrediction();

  const [url, setUrl] = useState(FIRST_URL);
  const [threshold, setThreshold] = useState(0.5);
  const [live, setLive] = useState(true);
  const [submitted, setSubmitted] = useState(FIRST_URL); // the URL "Predict" last sent
  const [presses, setPresses] = useState(0); // counts Predict / example clicks – see the effect
  const [edits, setEdits] = useState(0);

  // Live: classify what is in the box. Otherwise: only what was submitted.
  const target = live ? url : submitted;

  // Debounce: wait until nothing changed for 300 ms, THEN send one request.
  // Each keystroke re-runs the effect; the cleanup clears the pending timer first.
  // `presses` is a dependency so pressing Predict asks again even for the same text;
  // `status` so the demo asks again as soon as the back end starts (while the first
  // health check is still 'checking' there is no point in asking).
  useEffect(() => {
    if (status === 'checking') return undefined;
    const timer = setTimeout(() => predict(target, threshold), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [status, target, threshold, presses, predict]);

  function choose(value) {
    setUrl(value);
    setSubmitted(value);
    setPresses((n) => n + 1);
  }

  function toggleLive(on) {
    setLive(on);
    // Switching to manual keeps what is in the box as "submitted": the target stays the
    // same string, so no request is sent – and no older submission comes back.
    if (!on) setSubmitted(url);
  }

  const fieldError = error?.fieldErrors?.url; // 422 → { url: 'Please enter a URL.' }
  const otherError = error && !fieldError ? error : null;
  const suspicious = result?.label === 'suspicious';

  return (
    <div className="stack">
      <form className="mlserve-url-form" onSubmit={(e) => { e.preventDefault(); choose(url); }}>
        <label className="label" htmlFor={`${id}-url`}>URL to classify</label>
        <div className="mlserve-url-row">
          <input id={`${id}-url`} className="input mono" value={url} autoComplete="off" spellCheck={false}
            aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${id}-err` : undefined}
            onChange={(e) => { setUrl(e.target.value); setEdits((n) => n + 1); }} />
          <button type="submit" className="btn btn-primary" disabled={loading && !live}>
            <Send size={16} aria-hidden="true" /> Predict
          </button>
        </div>
        {fieldError && (
          <p className="error-text" id={`${id}-err`}>
            <span className="badge badge-danger">422</span> {fieldError}
          </p>
        )}
      </form>

      <div className="row" role="group" aria-label="Example URLs">
        <span className="small muted">Examples:</span>
        {examples.data?.map((ex) => (
          <button key={ex.url} type="button" className="btn btn-sm" title={ex.url} onClick={() => choose(ex.url)}>
            {ex.expected === 'safe'
              ? <ShieldCheck size={14} className="mlserve-ok" aria-label="expected safe" />
              : <ShieldAlert size={14} className="mlserve-miss" aria-label="expected suspicious" />}
            {ex.note}
          </button>
        ))}
        {examples.loading && <span className="spinner" aria-label="Loading examples" />}
        {!examples.data && !examples.loading && (
          <span className="small subtle">none yet – they come from GET /api/ml/examples once the back end runs.</span>
        )}
      </div>

      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={live} onChange={(e) => toggleLive(e.target.checked)} />
          <span className="switch-track" /> Predict as you type
        </label>
        <label className="mlserve-slider" htmlFor={`${id}-t`}>
          <span className="small">Threshold <strong>{pct0(threshold)}</strong></span>
          <input id={`${id}-t`} type="range" min="0.05" max="0.95" step="0.05" value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))} />
        </label>
      </div>

      <div className="row" role="group" aria-label="Send an invalid request">
        <span className="small muted">Send an invalid request:</span>
        {INVALID.map((bad) => (
          <button key={bad.label} type="button" className="btn btn-ghost btn-sm" onClick={() => choose(bad.url)}>
            {bad.label}
          </button>
        ))}
      </div>

      {(otherError || examples.offline) && <ApiErrorNote error={otherError} offline={examples.offline} />}

      <div className="mlserve-predict-result">
        <ProbabilityGauge probability={result?.probability} threshold={threshold} />
        <div className="stack-sm">
          <p className="m-0" aria-live="polite">
            {result ? (
              <span className={`badge mlserve-verdict ${suspicious ? 'badge-danger' : 'badge-success'}`}>
                {suspicious ? <ShieldAlert size={16} aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
                {suspicious ? 'Suspicious' : 'Looks safe'}
              </span>
            ) : (
              <span className="muted small">
                {loading ? 'Asking the model…'
                  : error?.isOffline ? 'No prediction – the back end is not reachable.'
                    : error ? 'No prediction – the server rejected the request.' : 'No prediction yet.'}
              </span>
            )}
          </p>
          <dl className="mlserve-facts">
            <dt>Probability</dt>
            <dd>{probability(result?.probability)} {result && <span className="subtle mono small">({result.probability})</span>}</dd>
            <dt>Threshold sent</dt><dd>{result ? pct0(result.threshold) : '–'}</dd>
            <dt>Model time</dt><dd>{ms(result?.latency_ms)}</dd>
            <dt>Round trip</dt><dd>{ms(roundTripMs)}</dd>
            <dt>Model version</dt><dd className="mono small">{result?.model_version ?? '–'}</dd>
          </dl>
          <p className="small muted m-0">
            {edits} edit{plural(edits)} → {sent} request{plural(sent)} sent · {cancelled} stale request{plural(cancelled)} cancelled
          </p>
        </div>
      </div>
    </div>
  );
}
