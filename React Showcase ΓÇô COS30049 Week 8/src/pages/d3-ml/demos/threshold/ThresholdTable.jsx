/**
 * ThresholdTable – the numbers behind the linked charts, as a table (closed by
 * default): the confusion matrix and the metrics at every 0.1 step, plus the
 * CURRENT threshold. Like every other view, it is derived from the `threshold`
 * prop during render – nothing extra is stored in state.
 */
import * as d3 from 'd3';
import { testSet } from '../data/phishingData.js';
import { confusionAt, metricsFrom } from '../data/metrics.js';
import { pct } from '../helpers/chart.js';

const rowAt = (threshold) => {
  const matrix = confusionAt(testSet, threshold);
  return { threshold, ...matrix, ...metricsFrom(matrix) };
};
const STEPS = d3.range(1, 10).map((i) => rowAt(i / 10)); // 0.1 … 0.9, computed once

export default function ThresholdTable({ threshold }) {
  const isCurrent = (row) => Math.abs(row.threshold - threshold) < 0.005;
  // The current threshold gets a row of its own – unless it IS one of the 0.1 steps.
  const rows = STEPS.some(isCurrent) ? STEPS : [...STEPS, rowAt(threshold)].sort((a, b) => a.threshold - b.threshold);

  return (
    <details className="d3ml-details">
      <summary>Show data table</summary>
      <div className="table-wrap">
        <table className="table">
          <caption className="small muted">Confusion matrix and metrics per threshold (1,000 test URLs)</caption>
          <thead>
            <tr>
              <th scope="col">Threshold</th>
              {['TP', 'FP', 'FN', 'TN', 'Precision', 'Recall', 'F1', 'FPR'].map((h) => <th key={h} scope="col" className="num">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.threshold} className={isCurrent(r) ? 'd3ml-row-current' : undefined}>
                <th scope="row" className="nowrap">{r.threshold.toFixed(2)}{isCurrent(r) && ' (current)'}</th>
                {[r.tp, r.fp, r.fn, r.tn].map((v, i) => <td key={i} className="num">{v}</td>)}
                {[r.precision, r.recall, r.f1, r.fpr].map((v, i) => <td key={i} className="num">{pct(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
