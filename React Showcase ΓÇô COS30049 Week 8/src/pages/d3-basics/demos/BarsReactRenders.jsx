/**
 * BarsReactRenders – chart A of TwoWaysDemo.jsx.
 * Pattern: D3 calculates, React renders.
 *
 * D3 is only used for MATHS here: d3.scaleLinear and d3.scaleBand turn data
 * values into pixel positions. React creates every SVG element with JSX, just
 * like any other component, so React DevTools, props and state all work as usual.
 *
 * Movement comes from plain CSS transitions (see d3-basics.css):
 *   - `transform` on each row   → rows slide when the order changes
 *   - `d` on each bar path      → bars grow/shrink (Chrome, Edge, Firefox; Safari jumps)
 *   - `transform` on each value → the label rides along with the end of its bar
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import { hBarPath } from './helpers/barPath.js';
import { MAX_STUDENTS } from './data/unitEnrolments.js';

const ROW = 30; // px per bar row
const MARGIN = { top: 8, right: 44, bottom: 28, left: 76 };

export default function BarsReactRenders({ data }) {
  const [ref, { width }] = useElementSize();
  const [active, setActive] = useState(null); // unit code under the pointer
  const height = MARGIN.top + data.length * ROW + MARGIN.bottom;

  // Scales are plain functions (value in → pixels out). Re-creating them on
  // every render is cheap, and they always match the current width.
  const x = d3
    .scaleLinear()
    .domain([0, MAX_STUDENTS])
    .range([MARGIN.left, Math.max(MARGIN.left, width - MARGIN.right)]);
  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.unit)) // the ORDER of the domain is the order of the rows
    .range([MARGIN.top, height - MARGIN.bottom])
    .padding(0.3);
  const ticks = x.ticks(width < 420 ? 3 : 6);

  return (
    <div ref={ref} className="viz">
      {width > 0 && (
        // role="group", not "img": the rows respond to the pointer, and the value labels stay readable
        <svg width={width} height={height} role="group" aria-label="Horizontal bar chart of students per unit">
          {/* Gridlines and tick labels, rendered from scale.ticks() with map() */}
          <g className="viz-grid">
            {ticks.map((t) => (
              <line key={t} x1={x(t)} x2={x(t)} y1={MARGIN.top} y2={height - MARGIN.bottom} />
            ))}
          </g>
          <g className="viz-axis">
            {ticks.map((t) => (
              <text key={t} x={x(t)} y={height - MARGIN.bottom + 18} textAnchor="middle">
                {t}
              </text>
            ))}
          </g>

          {data.map((d) => {
            const isActive = active === d.unit;
            return (
              // key = identity. When the array is re-ordered React MOVES this <g>
              // (so the CSS transition on transform can animate it).
              <g
                key={d.unit}
                className="d3-basics-bar-row"
                style={{ transform: `translateY(${y(d.unit)}px)`, opacity: active && !isActive ? 0.45 : 1 }}
                onPointerEnter={() => setActive(d.unit)}
                onPointerLeave={() => setActive(null)}
              >
                {/* A full-width, invisible hit area is much easier to hover than a thin bar */}
                <rect className="d3-basics-hit" x={0} y={-4} width={width} height={y.bandwidth() + 8} />
                <text className="viz-tick" x={MARGIN.left - 8} y={y.bandwidth() / 2} dy="0.32em" textAnchor="end">
                  {d.unit}
                </text>
                <path
                  className="d3-basics-bar d3-basics-bar-css"
                  d={hBarPath(x(0), 0, x(d.students) - x(0), y.bandwidth())}
                />
                {/* Always rendered, only faded in on hover – like the D3 version. Its position is a CSS
                    transform with the bar's duration and easing, so it follows the growing bar. */}
                <text
                  className="viz-label d3-basics-bar-value"
                  y={y.bandwidth() / 2}
                  dy="0.32em"
                  style={{ transform: `translateX(${x(d.students) + 6}px)`, opacity: isActive ? 1 : 0 }}
                >
                  {d.students}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
