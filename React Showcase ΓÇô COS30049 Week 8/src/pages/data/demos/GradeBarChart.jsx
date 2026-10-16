/**
 * GradeBarChart – a column chart drawn by hand with SVG (no chart library).
 *
 * The recipe behind every chart:
 *   1. shape the data   (count students per grade with reduce)
 *   2. build SCALES     (functions that turn a value into an x/y position)
 *   3. map() the data   (one <path> per bar, one <text> per label)
 * The viewBox gives us a fixed 440 × 250 coordinate system; CSS then scales
 * the whole drawing to the width of its container.
 */
import { useId, useState } from 'react';
import { students, GRADES } from '../../../data/students.js';

const W = 440;
const H = 250;
const M = { top: 24, right: 8, bottom: 40, left: 36 }; // margins leave room for the axes
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const GRADE_NAMES = { HD: 'High Distinction', D: 'Distinction', C: 'Credit', P: 'Pass', N: 'Fail' };

/** A bar with rounded top corners and a square base. */
function barPath(x, y, width, height, radius = 4) {
  const r = Math.min(radius, height, width / 2);
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}

export default function GradeBarChart() {
  const [hovered, setHovered] = useState(null); // index of the bar under the pointer
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  // 1. Data: { HD: 7, D: 5, … } → [{ grade: 'HD', count: 7 }, …] in grade order
  const counts = students.reduce((acc, s) => ({ ...acc, [s.grade]: (acc[s.grade] ?? 0) + 1 }), {});
  const data = GRADES.map((grade) => ({ grade, count: counts[grade] ?? 0 }));

  // 2. Scales
  const maxValue = Math.ceil(Math.max(...data.map((d) => d.count)) / 2) * 2; // round up to an even number
  const y = (value) => M.top + PLOT_H - (value / maxValue) * PLOT_H;
  const band = PLOT_W / data.length; // horizontal space for each bar
  const barWidth = Math.min(32, band * 0.55);
  const ticks = Array.from({ length: maxValue / 2 + 1 }, (_, i) => i * 2);

  const summary = data.map((d) => `${d.grade} ${d.count}`).join(', ');
  const active = hovered === null ? null : data[hovered];

  return (
    <figure className="data-figure">
      <figcaption className="data-figure-title">Students per grade</figcaption>
      {/* maxWidth: never scale the drawing up, so text stays at its natural size */}
      <div className="data-chart" style={{ maxWidth: W }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Column chart of students per grade: ${summary}.`}>
          {/* Gridlines + y-axis labels */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="data-grid" x1={M.left} x2={W - M.right} y1={y(tick)} y2={y(tick)} />
              <text className="data-axis-label" x={M.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                {tick}
              </text>
            </g>
          ))}

          {/* 3. One bar per grade */}
          {data.map((d, i) => {
            const x = M.left + band * i + (band - barWidth) / 2;
            const isDimmed = hovered !== null && hovered !== i;
            return (
              <g key={d.grade} onPointerEnter={() => setHovered(i)} onPointerLeave={() => setHovered(null)}>
                {/* Invisible, full-height hit area: much easier to hover than the bar itself */}
                <rect x={M.left + band * i} y={M.top} width={band} height={PLOT_H} fill="transparent" />
                <path
                  d={barPath(x, y(d.count), barWidth, y(0) - y(d.count))}
                  style={{ fill: 'var(--chart-1)', opacity: isDimmed ? 0.4 : 1, transition: 'opacity 150ms' }}
                />
                <text className="data-value-label" x={x + barWidth / 2} y={y(d.count) - 6} textAnchor="middle">
                  {d.count}
                </text>
                <text className="data-axis-label" x={x + barWidth / 2} y={H - M.bottom + 18} textAnchor="middle">
                  {d.grade}
                </text>
              </g>
            );
          })}

          <line className="data-axis" x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} />
          <text className="data-axis-title" x={M.left + PLOT_W / 2} y={H - 4} textAnchor="middle">
            Grade
          </text>
        </svg>

        {/* The tooltip is normal HTML, positioned with percentages of the viewBox */}
        {active && (
          <div
            className="data-tooltip"
            style={{ left: `${((M.left + band * (hovered + 0.5)) / W) * 100}%`, top: `${(y(active.count) / H) * 100}%` }}
          >
            <strong>{active.count} students</strong>
            <span>
              {GRADE_NAMES[active.grade]} · {Math.round((active.count / students.length) * 100)}%
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-sm btn-ghost"
        aria-expanded={showTable}
        aria-controls={tableId}
        onClick={() => setShowTable(!showTable)}
      >
        {showTable ? 'Hide' : 'Show'} data table
      </button>
      {/* The accessible alternative: the same numbers as a real table */}
      <div className="table-wrap" id={tableId} hidden={!showTable}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Grade</th>
              <th scope="col" className="num">Students</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.grade}>
                <th scope="row">
                  {GRADE_NAMES[d.grade]} ({d.grade})
                </th>
                <td className="num">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
