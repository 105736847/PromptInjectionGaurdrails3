/**
 * ScoreLineChart – change over time with a line + area chart and a crosshair
 * tooltip that snaps to the nearest week.
 *
 * Lines are SVG <path>s whose "d" attribute we build from the data:
 * "M x,y" moves the pen to the first point and "L x,y" draws to the next.
 */
import { useId, useState } from 'react';
import { weeklyScores } from './weeklyScores.js';

const W = 600;
const H = 280;
const M = { top: 16, right: 116, bottom: 40, left: 40 }; // extra right margin for end labels
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const SERIES = [
  { key: 'cohort', label: 'Whole cohort', color: 'var(--chart-1)' },
  { key: 'atRisk', label: 'At-risk group', color: 'var(--chart-2)' },
];

// Scales: week 1…12 → x position, score 0…100 → y position (SVG y grows downwards!)
const x = (week) => M.left + ((week - 1) / (weeklyScores.length - 1)) * PLOT_W;
const y = (score) => M.top + PLOT_H - (score / 100) * PLOT_H;

function linePath(key) {
  return weeklyScores.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.week)},${y(d[key])}`).join(' ');
}

export default function ScoreLineChart() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  // The area is the line, then down to the x-axis and back to the start.
  const first = weeklyScores[0];
  const last = weeklyScores[weeklyScores.length - 1];
  const areaPath = `${linePath('cohort')} L${x(last.week)},${y(0)} L${x(first.week)},${y(0)} Z`;

  function handlePointerMove(event) {
    // Convert the mouse position from screen pixels into viewBox units…
    const box = event.currentTarget.getBoundingClientRect();
    const viewBoxX = ((event.clientX - box.left) / box.width) * W;
    // …then snap to the nearest week.
    const step = PLOT_W / (weeklyScores.length - 1);
    const index = Math.round((viewBoxX - M.left) / step);
    setActiveIndex(Math.max(0, Math.min(weeklyScores.length - 1, index)));
  }

  const active = activeIndex === null ? null : weeklyScores[activeIndex];
  const tooltipOnLeft = activeIndex !== null && activeIndex > weeklyScores.length / 2;

  return (
    <figure className="data-figure">
      <figcaption className="data-figure-title">Average score per week</figcaption>
      <ul className="data-legend data-legend-inline" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key}>
            <span className="data-line-key" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>

      {/* maxWidth: never scale the drawing up, so text stays at its natural size */}
      <div className="data-chart" style={{ maxWidth: W }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Line chart: the cohort average rose from ${first.cohort} in week 1 to ${last.cohort} in week 12; the at-risk group rose from ${first.atRisk} to ${last.atRisk}.`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActiveIndex(null)}
        >
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line className="data-grid" x1={M.left} x2={M.left + PLOT_W} y1={y(tick)} y2={y(tick)} />
              <text className="data-axis-label" x={M.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                {tick}
              </text>
            </g>
          ))}
          {/* A labelled reference line for the pass mark */}
          <line className="data-reference" x1={M.left} x2={M.left + PLOT_W} y1={y(50)} y2={y(50)} />
          <text className="data-axis-label" x={M.left + PLOT_W - 4} y={y(50) - 6} textAnchor="end">
            Pass mark (50)
          </text>

          {weeklyScores.map((d) => (
            <text key={d.week} className="data-axis-label" x={x(d.week)} y={H - M.bottom + 18} textAnchor="middle">
              {d.week}
            </text>
          ))}
          <text className="data-axis-title" x={M.left + PLOT_W / 2} y={H - 4} textAnchor="middle">
            Teaching week
          </text>

          <path d={areaPath} style={{ fill: 'var(--chart-1)', opacity: 0.1 }} />
          {SERIES.map((s) => (
            <g key={s.key}>
              <path d={linePath(s.key)} className="data-line" style={{ stroke: s.color }} />
              {/* Direct label at the end of each line */}
              <text className="data-end-label" x={x(last.week) + 10} y={y(last[s.key])} dominantBaseline="middle">
                {s.label} {last[s.key]}
              </text>
            </g>
          ))}

          {/* Crosshair + markers for the week under the pointer */}
          {active && (
            <g>
              <line className="data-crosshair" x1={x(active.week)} x2={x(active.week)} y1={M.top} y2={y(0)} />
              {SERIES.map((s) => (
                <circle
                  key={s.key}
                  className="data-marker"
                  cx={x(active.week)}
                  cy={y(active[s.key])}
                  r="5"
                  style={{ fill: s.color }}
                />
              ))}
            </g>
          )}
        </svg>

        {active && (
          <div
            className={`data-tooltip data-tooltip-side ${tooltipOnLeft ? 'is-left' : ''}`}
            style={{ left: `${(x(active.week) / W) * 100}%`, top: `${(M.top / H) * 100}%` }}
          >
            <span className="muted">Week {active.week}</span>
            {SERIES.map((s) => (
              <span key={s.key} className="data-tooltip-row">
                <span className="data-line-key" style={{ background: s.color }} aria-hidden="true" />
                <strong>{active[s.key]}</strong> {s.label}
              </span>
            ))}
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
      <div className="table-wrap" id={tableId} hidden={!showTable}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Week</th>
              {SERIES.map((s) => (
                <th key={s.key} scope="col" className="num">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeklyScores.map((d) => (
              <tr key={d.week}>
                <th scope="row">Week {d.week}</th>
                <td className="num">{d.cohort}</td>
                <td className="num">{d.atRisk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
