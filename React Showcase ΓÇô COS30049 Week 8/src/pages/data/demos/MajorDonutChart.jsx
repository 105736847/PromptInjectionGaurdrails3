/**
 * MajorDonutChart – part-to-whole: how the cohort splits across majors.
 *
 * Each slice is an SVG <path> built from two arcs. We walk around the circle,
 * giving every major an angle proportional to its share. Colours come from the
 * --chart-1…5 CSS variables and follow the MAJOR (not its rank), so a major
 * keeps its colour even if the numbers change.
 */
import { useId, useState } from 'react';
import { students, MAJORS } from '../../../data/students.js';

const SIZE = 220;
const CENTER = SIZE / 2;
const OUTER = 100;
const INNER = 64;

/** Point on a circle. Angle 0 = 12 o'clock, growing clockwise. */
function polar(angle, radius) {
  return [CENTER + radius * Math.sin(angle), CENTER - radius * Math.cos(angle)];
}

/** A ring segment ("annular sector") from startAngle to endAngle. */
function slicePath(startAngle, endAngle) {
  const [x1, y1] = polar(startAngle, OUTER);
  const [x2, y2] = polar(endAngle, OUTER);
  const [x3, y3] = polar(endAngle, INNER);
  const [x4, y4] = polar(startAngle, INNER);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M${x1},${y1}`,
    `A${OUTER},${OUTER} 0 ${largeArc} 1 ${x2},${y2}`, // outer edge, clockwise
    `L${x3},${y3}`,
    `A${INNER},${INNER} 0 ${largeArc} 0 ${x4},${y4}`, // inner edge, back again
    'Z',
  ].join(' ');
}

export default function MajorDonutChart() {
  const [hovered, setHovered] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  const total = students.length;
  // Build the slices: each one starts where the previous one ended.
  const slices = MAJORS.reduce((acc, major, i) => {
    const count = students.filter((s) => s.major === major).length;
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const end = start + (count / total) * Math.PI * 2;
    return [...acc, { major, count, start, end, color: `var(--chart-${i + 1})` }];
  }, []);

  const percent = (count) => `${Math.round((count / total) * 100)}%`;
  const active = hovered === null ? null : slices[hovered];

  return (
    <figure className="data-figure">
      <figcaption className="data-figure-title">Students by major</figcaption>
      <div className="data-donut">
        <div className="data-chart data-donut-chart">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={`Donut chart of students by major: ${slices.map((s) => `${s.major} ${s.count}`).join(', ')}.`}
          >
            {slices.map((slice, i) => (
              <path
                key={slice.major}
                d={slicePath(slice.start, slice.end)}
                className="data-slice"
                style={{ fill: slice.color, opacity: hovered !== null && hovered !== i ? 0.35 : 1 }}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
              />
            ))}
          </svg>
          {/* The hole in the middle doubles as the hover read-out */}
          <div className="data-donut-center" aria-hidden="true">
            <strong>{active ? active.count : total}</strong>
            <span>{active ? `${active.major} · ${percent(active.count)}` : 'students'}</span>
          </div>
        </div>

        {/* The legend shows every value, so nothing depends on hovering */}
        <ul className="data-legend">
          {slices.map((slice, i) => (
            <li
              key={slice.major}
              className={hovered === i ? 'is-active' : undefined}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
            >
              <span className="data-swatch" style={{ background: slice.color }} aria-hidden="true" />
              <span>{slice.major}</span>
              <span className="data-legend-value">
                {slice.count} <span className="muted">({percent(slice.count)})</span>
              </span>
            </li>
          ))}
        </ul>
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
              <th scope="col">Major</th>
              <th scope="col" className="num">Students</th>
              <th scope="col" className="num">Share</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((slice) => (
              <tr key={slice.major}>
                <th scope="row">{slice.major}</th>
                <td className="num">{slice.count}</td>
                <td className="num">{percent(slice.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
