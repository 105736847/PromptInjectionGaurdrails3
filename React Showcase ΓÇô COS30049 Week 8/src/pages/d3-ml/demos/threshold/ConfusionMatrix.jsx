/**
 * ConfusionMatrix – the 2 × 2 table behind every metric, as a heatmap.
 *
 * Pattern: D3 calculates, React renders
 * d3.scaleSequentialSqrt maps a count to a colour (sqrt so the small error
 * cells are still visible next to the huge "true negative" cell); React draws
 * the four cells.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useChartTheme from '../../../../hooks/useChartTheme.js';
import useElementSize from '../../../../hooks/useElementSize.js';
import { inkOn, num, pct } from '../helpers/chart.js';

const CELLS = [
  { key: 'tn', row: 0, col: 0, name: 'True negatives', note: 'Legitimate URLs correctly let through.' },
  { key: 'fp', row: 0, col: 1, name: 'False positives', note: 'Legitimate URLs wrongly blocked – annoyed users.' },
  { key: 'fn', row: 1, col: 0, name: 'False negatives', note: 'Phishing URLs that slipped through – the dangerous error.' },
  { key: 'tp', row: 1, col: 1, name: 'True positives', note: 'Phishing URLs correctly caught.' },
];
const LABELS = ['Legitimate', 'Phishing'];
const M = { top: 40, left: 40, gap: 2 }; // gap = 2px surface gap between cells

export default function ConfusionMatrix({ matrix }) {
  const colors = useChartTheme();
  const [ref, { width }] = useElementSize();
  const [active, setActive] = useState(null); // key of the hovered / focused cell

  const total = matrix.tp + matrix.fp + matrix.fn + matrix.tn;
  const size = Math.min(width, 340);
  const cell = (size - M.left) / 2;
  // A colour scale: domain = counts, range = our sequential palette (theme-aware).
  const color = d3.scaleSequentialSqrt([0, total], d3.interpolateRgbBasis(colors.sequential));
  const activeCell = CELLS.find((c) => c.key === active);

  return (
    <figure className="d3ml-figure">
      <figcaption className="d3ml-figure-title">Confusion matrix</figcaption>
      <div ref={ref}>
        {width > 0 && (
          <svg width={size} height={size - M.left + M.top} role="group"
            aria-label={`Confusion matrix: ${CELLS.map((c) => `${c.name} ${matrix[c.key]}`).join(', ')}.`}>
            <text className="viz-axis-title" x={M.left + cell} y={12} textAnchor="middle">Predicted</text>
            <text className="viz-axis-title" transform={`translate(12,${M.top + cell}) rotate(-90)`} textAnchor="middle">Actual</text>
            {LABELS.map((label, i) => (
              <g key={label} className="viz-axis">
                <text x={M.left + cell * (i + 0.5)} y={M.top - 8} textAnchor="middle">{label}</text>
                <text transform={`translate(${M.left - 8},${M.top + cell * (i + 0.5)}) rotate(-90)`} textAnchor="middle">{label}</text>
              </g>
            ))}

            {CELLS.map((c) => {
              const value = matrix[c.key];
              const fill = color(value);
              const x = M.left + c.col * cell;
              const y = M.top + c.row * cell;
              return (
                <g key={c.key} className="d3ml-cell" tabIndex={0} aria-label={`${c.name}: ${value}`}
                  onPointerEnter={() => setActive(c.key)} onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(c.key)} onBlur={() => setActive(null)}>
                  <rect x={x + M.gap / 2} y={y + M.gap / 2} width={cell - M.gap} height={cell - M.gap} rx={4}
                    style={{ fill, transition: 'fill 150ms' }}
                    className={active === c.key ? 'is-active' : undefined} />
                  {/* Text colour picked from the cell's luminance – readable on light AND dark cells */}
                  <g style={{ fill: inkOn(fill) }} textAnchor="middle">
                    <text x={x + cell / 2} y={y + cell / 2 - 12} fontSize={11} opacity={0.85}>{c.key.toUpperCase()}</text>
                    <text x={x + cell / 2} y={y + cell / 2 + 10} fontSize={cell > 100 ? 24 : 18} fontWeight={650}>{num(value)}</text>
                    <text x={x + cell / 2} y={y + cell / 2 + 28} fontSize={11} opacity={0.85}>{pct(value / total)}</text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      <p className="small muted m-0 d3ml-cell-note" aria-live="polite">
        {activeCell ? (
          <><strong>{activeCell.name}.</strong> {activeCell.note}</>
        ) : (
          'Hover or focus a cell to see what it means.'
        )}
      </p>
    </figure>
  );
}
