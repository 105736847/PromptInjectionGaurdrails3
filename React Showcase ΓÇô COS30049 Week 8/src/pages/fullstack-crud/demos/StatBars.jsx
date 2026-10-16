/**
 * StatBars – a small horizontal bar chart for one series of counts.
 * Pattern: D3 calculates, React renders.
 *
 * d3.scaleLinear maps a count (domain) to a bar length in pixels (range);
 * React draws every <path> and <text> with JSX. The chart measures its
 * container (useElementSize), so it fits a phone and a projector alike.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';

const ROW = 44; // px per category: label line + bar
const BAR = 18; // bar thickness (≤ 24 px, the rest of the row is air)
const BAR_TOP = 20; // label baseline sits above the bar
const VALUE_ROOM = 36; // space right of the longest bar for its value

/** Bar with a 4px rounded DATA end and a square baseline end. */
function hBarPath(length, radius = 4) {
  const r = Math.max(0, Math.min(radius, length, BAR / 2));
  return `M0,0H${length - r}Q${length},0 ${length},${r}V${BAR - r}Q${length},${BAR} ${length - r},${BAR}H0Z`;
}

export default function StatBars({ title, data, total }) {
  const [ref, { width }] = useElementSize();
  const [active, setActive] = useState(null); // label under the pointer / keyboard focus
  const height = data.length * ROW;

  // domain = the data values, range = the pixels available.
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.count) || 1])
    .range([0, Math.max(0, width - VALUE_ROOM)]);

  const hovered = data.find((d) => d.label === active);
  const hoveredIndex = data.indexOf(hovered);

  return (
    <figure className="crud-chart m-0">
      <figcaption className="crud-panel-title">{title}</figcaption>
      <div ref={ref} className="viz">
        {width > 0 && (
          <svg width={width} height={height} role="group" aria-label={`${title}: bar chart`}>
            {data.map((d, i) => (
              <g
                key={d.label}
                transform={`translate(0, ${i * ROW})`}
                className="crud-bar-row"
                style={{ opacity: active && active !== d.label ? 0.45 : 1 }}
                tabIndex={0}
                aria-label={`${d.label}: ${d.count} students${d.average_score != null ? `, average score ${d.average_score}` : ''}`}
                onPointerEnter={() => setActive(d.label)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(d.label)}
                onBlur={() => setActive(null)}
              >
                {/* The whole row is the hit area – much easier to hover than an 18px bar */}
                <rect className="crud-bar-hit" width={width} height={ROW} />
                <text className="viz-label" y={13}>{d.label}</text>
                <path className="crud-bar" transform={`translate(0, ${BAR_TOP})`} d={hBarPath(x(d.count))} />
                <text className="viz-label" x={x(d.count) + 6} y={BAR_TOP + BAR / 2} dy="0.35em">{d.count}</text>
              </g>
            ))}
          </svg>
        )}
        {hovered && (
          <div className="viz-tooltip" style={{ left: Math.min(x(hovered.count) + 12, Math.max(0, width - 170)), top: hoveredIndex * ROW + ROW }}>
            <div className="viz-tooltip-row"><strong>{hovered.count} students</strong></div>
            <div className="viz-tooltip-title">{hovered.label} · {total ? Math.round((hovered.count / total) * 100) : 0}% of all</div>
            <div className="viz-tooltip-row">average score <strong>{hovered.average_score ?? '–'}</strong></div>
          </div>
        )}
      </div>

      {/* Tooltips enhance, never gate: the same numbers as a plain table. */}
      <details className="crud-details">
        <summary>Show data table</summary>
        <table className="table">
          <thead><tr><th>{title}</th><th className="num">Students</th><th className="num">Avg score</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}><td>{d.label}</td><td className="num">{d.count}</td><td className="num">{d.average_score ?? '–'}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
