/**
 * ThresholdExplorer – LINKED VIEWS driven by ONE piece of React state.
 *
 * A classifier gives every URL a score; the THRESHOLD decides where
 * "legitimate" ends and "phishing" begins. Drag it in the histogram, use the
 * slider or the arrow keys, pick a preset, or click a point on either curve:
 * every view re-renders from the same `threshold` value (one-way data flow).
 *
 * Pattern: D3 calculates, React renders
 * D3 also lends two *behaviours* that never touch the DOM: d3.drag (in
 * ScoreHistogram) and d3.timer (the animated presets below).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { testSet, PREVALENCE } from '../data/phishingData.js';
import {
  averagePrecision, bestF1Threshold, confusionAt, metricsFrom, rocAuc, thresholdCurve, thresholdForRecall,
} from '../data/metrics.js';
import { prefersReducedMotion } from '../helpers/chart.js';
import ScoreHistogram from './ScoreHistogram.jsx';
import ConfusionMatrix from './ConfusionMatrix.jsx';
import MetricTiles from './MetricTiles.jsx';
import MetricCurve from './MetricCurve.jsx';
import ThresholdTable from './ThresholdTable.jsx';

// Things that never change are computed ONCE, outside the component.
const CURVE = thresholdCurve(testSet); // every possible operating point
const AUC = rocAuc(CURVE);
const AP = averagePrecision(CURVE);
const BASELINE = metricsFrom(confusionAt(testSet, 0.5));
const PRESETS = [
  { label: 'Default', value: 0.5 },
  { label: 'Best F1', value: bestF1Threshold(testSet) },
  { label: 'Catch 95% of phishing', value: thresholdForRecall(testSet, 0.95) },
];

export default function ThresholdExplorer() {
  const [threshold, setThreshold] = useState(0.5); // ← the single source of truth
  const [mode, setMode] = useState('share'); // histogram y: 'share' of class | raw 'count'
  const timerRef = useRef(null); // the running preset animation, if any

  // Derived data: cheap to compute, so we simply recompute on every render.
  const matrix = confusionAt(testSet, threshold);
  const metrics = metricsFrom(matrix);
  // The curves' operating point. When NOTHING is flagged (tp + fp = 0) precision is 0 / 0:
  // the tiles report 0 (like sklearn's precision_score, zero_division=0), but the PR curve
  // starts at precision 1 (like precision_recall_curve) – so the dot uses 1 to stay on it.
  const noneFlagged = matrix.tp + matrix.fp === 0;
  const operating = { fpr: metrics.fpr, tpr: metrics.recall, precision: noneFlagged ? 1 : metrics.precision };

  // useCallback keeps the function identity stable, so ScoreHistogram's drag
  // effect doesn't re-bind on every render. Any manual change cancels an animation.
  const changeThreshold = useCallback((value) => {
    timerRef.current?.stop();
    setThreshold(value);
  }, []);

  // Animate to a preset: d3.timer calls us every frame with the elapsed ms.
  function animateTo(target) {
    timerRef.current?.stop();
    if (prefersReducedMotion()) {
      setThreshold(target); // no animation for users who asked for less motion
      return;
    }
    const from = threshold;
    const ease = d3.easeCubicInOut;
    timerRef.current = d3.timer((elapsed) => {
      const t = Math.min(1, elapsed / 700);
      setThreshold(from + (target - from) * ease(t));
      if (t === 1) timerRef.current.stop();
    });
  }
  useEffect(() => () => timerRef.current?.stop(), []); // stop the timer on unmount

  return (
    <div className="stack">
      <div className="viz-controls">
        <label className="d3ml-slider">
          <span className="label">Threshold <output className="mono">{threshold.toFixed(2)}</output></span>
          <input type="range" min={0} max={1} step={0.01} value={threshold}
            onChange={(event) => changeThreshold(Number(event.target.value))} />
        </label>
        <div className="row" role="group" aria-label="Threshold presets">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="btn btn-sm" onClick={() => animateTo(p.value)}>
              {p.label} <span className="subtle mono">{p.value.toFixed(2)}</span>
            </button>
          ))}
        </div>
        <div className="btn-group" role="group" aria-label="Histogram scale">
          <button type="button" className={`btn btn-sm ${mode === 'share' ? 'active' : ''}`} aria-pressed={mode === 'share'} onClick={() => setMode('share')}>% of class</button>
          <button type="button" className={`btn btn-sm ${mode === 'count' ? 'active' : ''}`} aria-pressed={mode === 'count'} onClick={() => setMode('count')}>Raw counts</button>
        </div>
      </div>

      <MetricTiles metrics={metrics} baseline={BASELINE} />

      <ScoreHistogram rows={testSet} threshold={threshold} onThresholdChange={changeThreshold} mode={mode} matrix={matrix} />

      <div className="d3ml-linked-grid">
        <ConfusionMatrix matrix={matrix} />
        <MetricCurve points={CURVE} onPick={changeThreshold} title="ROC curve" xKey="fpr" yKey="tpr" curve={d3.curveLinear}
          xLabel="False-positive rate" yLabel="True-positive rate" operating={operating}
          reference={{ type: 'diagonal', label: 'random guess' }} summary={`AUC = ${AUC.toFixed(3)}`} />
        <MetricCurve points={CURVE} onPick={changeThreshold} title="Precision–recall curve" xKey="tpr" yKey="precision" curve={d3.curveStepBefore}
          xLabel="Recall" yLabel="Precision" operating={operating}
          reference={{ type: 'horizontal', y: PREVALENCE, label: `no skill = ${Math.round(PREVALENCE * 100)}% phishing` }}
          summary={`AP = ${AP.toFixed(3)}`} />
      </div>
      <p className="small muted m-0">Click a point on either curve to use its threshold.</p>

      <ThresholdTable threshold={threshold} />
    </div>
  );
}
