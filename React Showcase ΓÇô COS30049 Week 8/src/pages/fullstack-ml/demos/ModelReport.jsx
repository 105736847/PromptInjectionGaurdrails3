/**
 * ModelReport – "is the model any good?" from GET /api/ml/metrics.
 *
 * Every number was computed ONCE by train.py on 1,000 test URLs the model never
 * saw while training. The threshold slider does NOT retrain or call the server:
 * it only looks up a row in the thresholds table the back end already sent.
 * Picking a row from data you already have is derived state – no useEffect.
 */
import { useId, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import useApiGet from './useApiGet.js';
import { getMetrics } from './mlApi.js';
import RocCurve from './charts/RocCurve.jsx';
import ConfusionMatrix from './charts/ConfusionMatrix.jsx';
import ApiErrorNote from './ApiErrorNote.jsx';
import { num, pct } from './charts/chartUtils.js';

const TILES = [
  { key: 'accuracy', label: 'Accuracy', hint: 'share of all test URLs labelled correctly' },
  { key: 'precision', label: 'Precision', hint: 'of the URLs flagged, how many really were suspicious' },
  { key: 'recall', label: 'Recall', hint: 'of the suspicious URLs, how many were caught' },
  { key: 'f1', label: 'F1 score', hint: 'balance of precision and recall' },
];

export default function ModelReport() {
  const id = useId();
  const { data, loading, error, offline, reload } = useApiGet(getMetrics);
  const [threshold, setThreshold] = useState(0.5);

  if (offline) return <ApiErrorNote offline />; // fills itself in once the back end is running
  if (error) {
    // Any other failure (a 500, a timeout, a restart of uvicorn --reload): offer a way out.
    return (
      <div className="stack-sm">
        <ApiErrorNote error={error} />
        <button type="button" className="btn btn-sm mlserve-self-start" onClick={reload}>
          <RefreshCw size={14} aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }
  if (loading || !data) return <p className="row muted small"><span className="spinner" aria-hidden="true" /> Loading metrics…</p>;

  const byThreshold = (t) => data.thresholds.find((r) => Math.abs(r.threshold - t) < 1e-6);
  const row = byThreshold(threshold);
  const base = byThreshold(0.5);
  const bestF1 = data.thresholds.reduce((best, r) => (r.f1 > best.f1 ? r : best));

  return (
    <div className="stack">
      <div className="viz-controls">
        <label className="mlserve-slider mlserve-slider-wide" htmlFor={`${id}-t`}>
          <span className="small">Decision threshold <strong>{threshold.toFixed(2)}</strong></span>
          <input id={`${id}-t`} type="range" min="0.01" max="0.99" step="0.01" value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))} />
        </label>
        <div className="btn-group" role="group" aria-label="Threshold presets">
          {[['0.50', 0.5], [`Best F1 (${bestF1.threshold.toFixed(2)})`, bestF1.threshold]].map(([text, value]) => (
            <button key={text} type="button" className={`btn btn-sm${threshold === value ? ' active' : ''}`}
              aria-pressed={threshold === value} onClick={() => setThreshold(value)}>
              {text}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          <RefreshCw size={14} aria-hidden="true" /> Reload
        </button>
      </div>

      <dl className="mlserve-tiles">
        {TILES.map((t) => (
          <div key={t.key} title={t.hint}>
            <dt>{t.label}</dt>
            <dd>{pct(row[t.key])}</dd>
            <dd className="mlserve-tile-note">at 0.50: {pct(base[t.key])}</dd>
          </div>
        ))}
        <div title="Area under the ROC curve – does not depend on the threshold">
          <dt>ROC AUC</dt>
          <dd>{data.roc_auc.toFixed(3)}</dd>
          <dd className="mlserve-tile-note">any threshold</dd>
        </div>
      </dl>

      <div className="mlserve-report-grid">
        <RocCurve points={data.roc_curve} auc={data.roc_auc} operating={{ threshold, fpr: row.fpr, tpr: row.recall }} />
        <ConfusionMatrix tp={row.tp} fp={row.fp} tn={row.tn} fn={row.fn} />
      </div>

      <p className="small muted m-0">
        Model <code>{data.model_version}</code> · {data.algorithm} · trained {new Date(data.trained_at).toLocaleString()} in{' '}
        {data.training_seconds} s on {num(data.sizes.train)} URLs, tested on {num(data.sizes.test)} ·{' '}
        {pct(data.sizes.positive_rate)} of the data is suspicious · {data.data_source}
      </p>
    </div>
  );
}
