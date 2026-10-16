/**
 * ResponsiveLine – a chart that fits its container.
 * Pattern: mixed – React renders the marks (bands, area, line, crosshair); D3 owns the two axis <g>s.
 *
 * useElementSize() measures the box (ResizeObserver) and the chart is redrawn
 * for the new width: scales get a new range, and the NUMBER of ticks and the
 * label format adapt, so text stays readable from phone to projector.
 * For the time axis we pass an INTERVAL (d3.timeMonth.every(k)) instead of a
 * count: for dates, ticks(6) is only a hint that d3 snaps to 1 or 3 months.
 * Drag the bottom-right corner of the dashed box, or use the preset buttons.
 *
 * The <svg> is focusable and reacts to the arrow keys, so it is a role="group"
 * (role="img" would turn it into a flat picture); a live region reads the value out.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import { weeks, SEMESTERS } from './data/weeklyActive.js';

const bisectDate = d3.bisector((d) => d.date).center; // index of the week nearest to a date
const formatValue = d3.format(',');
const formatWeek = d3.timeFormat('%-d %b %Y');

export default function ResponsiveLine() {
  const boxRef = useRef(null);
  const [sizeRef, { width }] = useElementSize();
  const [active, setActive] = useState(null); // index of the highlighted week
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);

  // Everything that depends on the width, recomputed only when the width changes.
  const chart = useMemo(() => {
    const compact = width < 480;
    const height = Math.round(Math.max(210, Math.min(320, width * 0.5)));
    const M = { top: compact ? 12 : 28, right: 16, bottom: 28, left: compact ? 34 : 52 };
    const x = d3.scaleTime().domain(d3.extent(weeks, (d) => d.date)).range([M.left, width - M.right]);
    const y = d3.scaleLinear().domain([0, d3.max(weeks, (d) => d.value)]).nice().range([height - M.bottom, M.top]);
    // The fewest months per label that still give every label ≈ 64px (the domain is one year).
    const pxPerMonth = (width - M.left - M.right) / 12;
    const months = [1, 2, 3].find((k) => k * pxPerMonth >= 64) ?? 3;
    const xInterval = d3.timeMonth.every(months); // exact – unlike a count, which is only a hint
    const yTicks = Math.max(2, Math.floor((height - M.top - M.bottom) / 50)); // linear scale: a count works well
    return { compact, height, M, x, y, months, xInterval, yTicks };
  }, [width]);
  const { compact, height, M, x, y, months, xInterval, yTicks } = chart;

  useEffect(() => {
    if (width === 0) return;
    d3.select(xAxisRef.current).call(
      d3.axisBottom(x).ticks(xInterval).tickFormat(compact ? d3.timeFormat('%b') : null).tickSizeOuter(0),
    );
    d3.select(yAxisRef.current)
      .call(d3.axisLeft(y).ticks(yTicks).tickFormat(d3.format(compact ? '~s' : ',')).tickSize(-(width - M.left - M.right)))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('class', 'd3-basics-gridline'));
  }, [width, x, y, xInterval, yTicks, compact, M]);

  const line = d3.line((d) => x(d.date), (d) => y(d.value)).curve(d3.curveMonotoneX);
  const area = d3.area((d) => x(d.date), y(0), (d) => y(d.value)).curve(d3.curveMonotoneX);
  const point = active === null ? null : weeks[active];
  const setBoxWidth = (value) => { boxRef.current.style.width = value; }; // same thing the resize handle does

  function handleKey(event) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    setActive((i) => Math.max(0, Math.min(weeks.length - 1, (i ?? weeks.length - 1) + step)));
  }

  return (
    <div className="stack">
      <div className="viz-controls">
        <button type="button" className="btn btn-sm" onClick={() => setBoxWidth('360px')}><Smartphone size={15} aria-hidden="true" /> 360px</button>
        <button type="button" className="btn btn-sm" onClick={() => setBoxWidth('640px')}><Tablet size={15} aria-hidden="true" /> 640px</button>
        <button type="button" className="btn btn-sm" onClick={() => setBoxWidth('100%')}><Monitor size={15} aria-hidden="true" /> Full width</button>
        <span className="badge badge-code d3-basics-badge-wrap" aria-live="polite">
          width {width}px · timeMonth.every({months}) → {x.ticks(xInterval).length} labels · {compact ? 'compact' : 'full'} format
        </span>
      </div>

      <div ref={boxRef} className="d3-basics-resize">
        <div ref={sizeRef} className="viz">
          {width > 0 && (
            // role="group", not "img": a focusable, keyboard-driven chart must not be a flat picture
            <svg width={width} height={height} tabIndex={0} role="group" onKeyDown={handleKey} onBlur={() => setActive(null)}
              aria-label="Line chart of weekly active students in 2026, high during semesters 1 and 2. Use the arrow keys to read values."
              onPointerMove={(e) => setActive(bisectDate(weeks, x.invert(d3.pointer(e.nativeEvent, e.currentTarget)[0])))}
              onPointerLeave={() => setActive(null)}>
              {SEMESTERS.map((s) => (
                <g key={s.label}>
                  <rect className="d3-basics-band-bg" x={x(s.start)} y={M.top} width={x(s.end) - x(s.start)} height={height - M.top - M.bottom} />
                  {!compact && <text className="viz-label-muted" x={x(s.start) + 6} y={M.top + 14}>{s.label}</text>}
                </g>
              ))}
              {/* React positions the outer <g>; D3 owns everything inside the inner one */}
              <g transform={`translate(${M.left},0)`}><g ref={yAxisRef} className="viz-axis" /></g>
              <g transform={`translate(0,${height - M.bottom})`}><g ref={xAxisRef} className="viz-axis" /></g>
              {!compact && <text className="viz-axis-title" x={M.left} y={12}>Weekly active students</text>}
              <path className="d3-basics-area" d={area(weeks)} />
              <path className="d3-basics-line" d={line(weeks)} />
              {point && (
                <g>
                  <line className="d3-basics-crosshair" x1={x(point.date)} x2={x(point.date)} y1={M.top} y2={height - M.bottom} />
                  <circle className="d3-basics-marker-dot" cx={x(point.date)} cy={y(point.value)} r={5} />
                </g>
              )}
            </svg>
          )}
          {point && (
            <div className={`viz-tooltip d3-basics-tip-side${x(point.date) > width / 2 ? ' is-left' : ''}`} style={{ left: x(point.date), top: M.top }}>
              <div className="viz-tooltip-title">Week of {formatWeek(point.date)}</div>
              <div className="viz-tooltip-row">
                <span className="viz-key-line" style={{ background: 'var(--chart-1)' }} />
                Active students <strong>{formatValue(point.value)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Screen readers hear the week that the arrow keys (or the pointer) selected */}
      <p className="visually-hidden" aria-live="polite">
        {point ? `Week of ${formatWeek(point.date)}: ${formatValue(point.value)} active students` : ''}
      </p>

      <details className="d3-basics-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption>Weekly active students in 2026 (fictional)</caption>
            <thead>
              <tr><th scope="col">Week of</th><th scope="col" className="num">Active students</th></tr>
            </thead>
            <tbody>
              {weeks.map((d) => (
                <tr key={+d.date}>
                  <th scope="row">{formatWeek(d.date)}</th>
                  <td className="num">{formatValue(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
