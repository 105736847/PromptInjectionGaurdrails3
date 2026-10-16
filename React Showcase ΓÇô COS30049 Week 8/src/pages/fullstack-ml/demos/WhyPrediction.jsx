/**
 * WhyPrediction – explain ONE prediction feature by feature.
 *
 * The back end does the maths (model.py): for a linear model,
 *   log-odds = intercept + Σ weight × scaled value,   probability = sigmoid(log-odds)
 * and returns every term as `contributions`. React only has to draw them.
 * Hovering a bar highlights the same row in the table: both read ONE piece of
 * state (`active`), lifted up into this component.
 */
import { useEffect, useId, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import useBackendStatus from '../../../hooks/useBackendStatus.js';
import useApiGet from './useApiGet.js';
import usePrediction from './usePrediction.js';
import { getExamples } from './mlApi.js';
import ContributionsChart from './charts/ContributionsChart.jsx';
import ApiErrorNote from './ApiErrorNote.jsx';
import { probability, signed } from './charts/chartUtils.js';

const FIRST_URL = 'http://brightwater-uni-support-verify.test/secure/login/x8f2k9?id=a8f3kq2z9x&n=48213';
const raw = (value) => (Number.isInteger(value) ? value : value.toFixed(2));

export default function WhyPrediction() {
  const id = useId();
  const { status } = useBackendStatus();
  const examples = useApiGet(getExamples);
  const { result, error, loading, predict } = usePrediction();
  const [draft, setDraft] = useState(FIRST_URL);
  const [request, setRequest] = useState({ url: FIRST_URL });
  const [active, setActive] = useState(null); // the feature under the mouse / keyboard focus

  // Ask again whenever a new URL is requested – and when the back end comes online. While the
  // first health check is still running we wait, so the page load sends ONE request, not two.
  useEffect(() => {
    if (status === 'checking') return;
    predict(request.url, 0.5);
  }, [status, request, predict]);

  function explain(url) {
    setDraft(url);
    setRequest({ url }); // a NEW object, so the effect runs even for the same text
  }

  const fieldError = error?.fieldErrors?.url; // 422 from Pydantic → shown under the input
  const otherError = error && !fieldError ? error : null;
  const featureSum = result ? result.logit - result.intercept : 0;
  const sorted = result ? [...result.contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)) : [];
  const clipped = sorted.filter((c) => c.clipped_to != null);
  const announcement = result
    ? `P(suspicious) ${probability(result.probability)}, ${result.label}. Biggest push: ${sorted[0].label} ${signed(sorted[0].contribution)}.`
    : loading ? 'Asking the model…' : '';

  return (
    <div className="stack">
      <form className="mlserve-url-form" onSubmit={(e) => { e.preventDefault(); explain(draft); }}>
        <label className="visually-hidden" htmlFor={`${id}-url`}>URL to explain</label>
        <div className="mlserve-url-row">
          <input id={`${id}-url`} className="input mono" value={draft} spellCheck={false}
            aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${id}-err` : undefined}
            onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Lightbulb size={16} aria-hidden="true" /> Explain
          </button>
        </div>
        {fieldError && (
          <p className="error-text" id={`${id}-err`}>
            <span className="badge badge-danger">422</span> {fieldError}
          </p>
        )}
      </form>
      <div className="row mlserve-chips" role="group" aria-label="Example URLs">
        {examples.data?.map((ex) => (
          <button key={ex.url} type="button" className="btn btn-sm" aria-pressed={request.url === ex.url}
            title={ex.url} onClick={() => explain(ex.url)}>
            {ex.note}
          </button>
        ))}
        {/* Can padding fool the model? The server clips every feature to its training range. */}
        <button type="button" className="btn btn-ghost btn-sm" title="Append /aaa… (300 letters) to the URL above"
          onClick={() => explain(`${draft.trim()}/${'a'.repeat(300)}`)}>
          + 300 letters
        </button>
      </div>

      {(otherError || examples.offline) && <ApiErrorNote error={otherError} offline={examples.offline} />}
      {/* Always in the page, so screen readers hear the FIRST result too, not only later ones. */}
      <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>

      {result && (
        <>
          {/* The whole model in one line – the numbers come straight from the JSON. */}
          <p className="mlserve-equation">
            <span><small>baseline</small>{signed(result.intercept)}</span>
            <span className="mlserve-op">+</span>
            <span><small>{result.contributions.length} features</small>{signed(featureSum)}</span>
            <span className="mlserve-op">=</span>
            <span><small>log-odds</small>{signed(result.logit)}</span>
            <span className="mlserve-op">→ sigmoid →</span>
            <span className={result.label === 'suspicious' ? 'is-suspicious' : 'is-safe'}>
              <small>P(suspicious)</small>{probability(result.probability)}
            </span>
          </p>
          {clipped.length > 0 && (
            <p className="small muted m-0">
              <span className="badge badge-warning">clipped</span>{' '}
              {clipped.map((c) => c.label).join(', ')} {clipped.length === 1 ? 'was' : 'were'} outside the range seen
              in training, so the model used the nearest value it knows (→ in the table).
            </p>
          )}

          <ContributionsChart contributions={result.contributions} active={active} onActiveChange={setActive} />

          <details className="mlserve-details" open>
            <summary>Feature values sent through the model</summary>
            <div className="table-wrap">
              <table className="table mlserve-feature-table">
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    <th scope="col" className="num">Raw value</th>
                    <th scope="col" className="num">Scaled (z)</th>
                    <th scope="col" className="num">× Weight</th>
                    <th scope="col" className="num">= Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => (
                    <tr key={c.feature} className={active === c.feature ? 'is-active' : undefined}>
                      <th scope="row" title={c.description}>{c.label}</th>
                      <td className="num">
                        {raw(c.value)}
                        {c.clipped_to != null && <span className="mlserve-clipped"> → {raw(c.clipped_to)}</span>}
                      </td>
                      <td className="num">{signed(c.scaled)}</td>
                      <td className="num">{signed(c.weight)}</td>
                      <td className="num"><strong>{signed(c.contribution)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      {!result && loading && <p className="muted small">Asking the model…</p>}
    </div>
  );
}
