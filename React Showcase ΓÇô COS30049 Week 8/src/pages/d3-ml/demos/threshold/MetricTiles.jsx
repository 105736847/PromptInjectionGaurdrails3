/**
 * MetricTiles – five stat tiles. Sometimes the best "chart" is just a number.
 *
 * Each tile also shows the change compared with the default threshold (0.5),
 * coloured by whether that change is GOOD (for FPR, lower is better).
 */
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { pct } from '../helpers/chart.js';

const TILES = [
  { key: 'accuracy', label: 'Accuracy', hint: 'All correct ÷ all URLs', higherIsBetter: true },
  { key: 'precision', label: 'Precision', hint: 'Flagged URLs that really were phishing', higherIsBetter: true },
  { key: 'recall', label: 'Recall (TPR)', hint: 'Phishing URLs we caught', higherIsBetter: true },
  { key: 'f1', label: 'F1 score', hint: 'Harmonic mean of precision and recall', higherIsBetter: true },
  { key: 'fpr', label: 'False-positive rate', hint: 'Legitimate URLs we wrongly blocked', higherIsBetter: false },
];

export default function MetricTiles({ metrics, baseline }) {
  return (
    <ul className="d3ml-tiles" aria-label="Metrics at the current threshold">
      {TILES.map((tile) => {
        const value = metrics[tile.key];
        const delta = value - baseline[tile.key];
        const points = Math.abs(delta * 100).toFixed(1);
        const flat = points === '0.0';
        const good = delta > 0 === tile.higherIsBetter;
        const Arrow = delta > 0 ? ArrowUpRight : ArrowDownRight;
        return (
          <li key={tile.key} className="d3ml-tile" title={tile.hint}>
            <span className="d3ml-tile-label">{tile.label}</span>
            <strong className="d3ml-tile-value">{pct(value)}</strong>
            {/* A thin meter under the number: the value as a proportion of 100% */}
            <span className="d3ml-meter" aria-hidden="true"><span style={{ width: `${value * 100}%` }} /></span>
            <span className={`d3ml-delta ${flat ? '' : good ? 'is-good' : 'is-bad'}`}>
              {flat ? 'same as at 0.50' : (
                <>
                  <Arrow size={14} aria-hidden="true" />
                  {delta > 0 ? '+' : '−'}{points} pts vs 0.50
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
