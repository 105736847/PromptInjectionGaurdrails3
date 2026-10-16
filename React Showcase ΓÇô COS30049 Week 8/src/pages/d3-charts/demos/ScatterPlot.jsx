/**
 * ScatterPlot – 400 students: weekly study hours vs final score (size = attendance).
 * Pattern: D3 owns the <g>. The work is split into three effects that each own ONE job:
 *   1. build – scales, axes, dots, the zoom behaviour and the hover layer (re-runs only when the size changes)
 *   2. mode  – attaches EITHER the zoom (pan & zoom) OR a d3.brush (select), and removes it again
 *   3. trend – draws the least-squares line in, or hides it
 * Hover uses d3.Delaunay: the pointer finds the NEAREST student, so nobody has to hit a 5px dot.
 * Zoom and brush are remembered in DATA units (hours, points) in refs – pixels change with the width.
 * Keyboard route: the "Quick select" buttons draw a brush box from DATA units with brush.move.
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Move, RotateCcw, SquareDashedMousePointer } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import { motion, pageFriendlyZoom, svgId } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { CAMPUSES } from './data/cohort.js';

const M = { top: 28, right: 16, bottom: 44, left: 44 };
// Scatter plots use colour slots 1–3 only: every colour can end up next to every other.
const campusColor = d3.scaleOrdinal(CAMPUSES, ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']);
// Dot size = attendance. Phones get smaller dots: 400 students share a ~250px wide plot there.
const SIZES = { wide: d3.scaleSqrt([40, 100], [2.5, 7]), narrow: d3.scaleSqrt([40, 100], [2, 5]) };
// Brush boxes you can pick without a mouse, as two [hours, score] corners: top-left, bottom-right.
const PRESETS = [
  { label: '≥ 20 h/week', box: [[20, 104], [30, 0]] },
  { label: 'Score < 50', box: [[0, 49.5], [30, 0]] }, // scores are whole numbers, so 49.5 keeps 50 out
];

export default function ScatterPlot({ students, fit, onSelect }) {
  const [wrapRef, { width }] = useElementSize();
  const svgRef = useRef(null);
  const chart = useRef(null); // what effect 1 builds and effects 2 + 3 reuse
  const view = useRef(null); // the visible { hours: [min, max], score: [min, max] }
  const picked = useRef(null); // the brushed box as two [hours, score] corners, or null
  const [mode, setMode] = useState('zoom');
  const [showTrend, setShowTrend] = useState(true);
  const [tip, setTip] = useState(null);
  const clipId = svgId(useId(), 'scatter-clip');
  const r = width < 520 ? SIZES.narrow : SIZES.wide;
  const height = width < 520 ? 340 : 420;
  const innerW = Math.max(0, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const summary = `Scatter plot of ${students.length} students: more weekly study hours go with higher final scores `
    + `(r = ${fit.r.toFixed(2)}).`;

  // 1. build
  useEffect(() => {
    if (innerW === 0) return undefined;
    const svg = d3.select(svgRef.current);
    const zoomRect = svg.select('.zoom');
    const x = d3.scaleLinear([0, 30], [0, innerW]);
    const y = d3.scaleLinear([0, 104], [innerH, 0]); // a little headroom so dots at 100 points aren't cut in half
    const dots = svg.select('.dots').selectAll('circle').data(students, (d) => d.id).join('circle')
      .attr('class', 'd3c-dot').attr('r', (d) => r(d.attendance)).style('fill', (d) => campusColor(d.campus));
    const ring = svg.select('.ring').attr('display', 'none');
    const hide = () => {
      ring.attr('display', 'none');
      setTip(null);
    };

    // Everything that moves when the zoom transform changes.
    function redraw(transform) {
      const zx = transform.rescaleX(x);
      const zy = transform.rescaleY(y);
      svg.select('.x-axis').call(d3.axisBottom(zx).ticks(innerW / 70));
      svg.select('.y-axis').call(d3.axisLeft(zy).ticks(6));
      svg.select('.grid').call(d3.axisLeft(zy).ticks(6).tickSize(-innerW).tickFormat(''));
      dots.attr('cx', (d) => zx(d.hours)).attr('cy', (d) => zy(d.score));
      svg.select('.trend')
        .attr('x1', zx(0)).attr('y1', zy(fit.intercept))
        .attr('x2', zx(30)).attr('y2', zy(fit.intercept + fit.slope * 30));
      hide(); // the dots moved, so the ring and the tooltip would point at the wrong place
      view.current = { hours: zx.domain(), score: zy.domain() };
      Object.assign(chart.current, { zx, zy });
    }
    const extent = [[0, 0], [innerW, innerH]];
    const zoom = pageFriendlyZoom().scaleExtent([1, 12]).extent(extent).translateExtent(extent)
      .on('zoom', (event) => redraw(event.transform));
    chart.current = { dots, zoom, zoomRect, extent };

    // A zoom transform is in PIXELS, so after a resize the old one would point at the wrong place.
    // Rebuild it from the visible DATA range instead: scale by k, then shift that corner to (0, 0).
    const [h0, h1] = view.current?.hours ?? x.domain();
    const top = view.current?.score[1] ?? y.domain()[1];
    const k = innerW / (x(h1) - x(h0));
    zoomRect.call(zoom.transform, d3.zoomIdentity.scale(k).translate(-x(h0), -y(top))); // fires 'zoom' → redraw

    // Nearest-point hover. The Delaunay triangulation is built ONCE in un-zoomed pixels;
    // we undo the zoom on the pointer position (transform.invert) before searching.
    const delaunay = d3.Delaunay.from(students, (d) => x(d.hours), (d) => y(d.score));
    // pointerdown as well: a tap on a phone sends no pointermove at all.
    svg.on('pointermove.hover pointerdown.hover', (event) => {
      const [px, py] = d3.pointer(event, svg.select('.plot').node());
      const transform = d3.zoomTransform(zoomRect.node());
      const d = students[delaunay.find(...transform.invert([px, py]))];
      const cx = transform.applyX(x(d.hours));
      const cy = transform.applyY(y(d.score));
      const inside = px >= 0 && px <= innerW && py >= 0 && py <= innerH;
      if (!inside || Math.hypot(cx - px, cy - py) > 36) return hide(); // too far away: no tooltip
      ring.attr('display', null).attr('cx', cx).attr('cy', cy).attr('r', r(d.attendance) + 4);
      setTip({
        x: M.left + cx,
        y: M.top + cy,
        title: d.name,
        rows: [
          { key: 'dot', color: campusColor(d.campus), label: 'Campus', value: d.campus },
          { label: 'Final score', value: d.score },
          { label: 'Study per week', value: `${d.hours} h` },
          { label: 'Attendance', value: `${d.attendance} %` },
        ],
      });
    }).on('pointerleave.hover', (event) => {
      if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
    });
    const stopDismiss = onPointerDownOutside(svg.node(), hide); // …until the next tap outside the chart

    return () => {
      stopDismiss();
      svg.on('.hover', null);
      zoomRect.interrupt();
    };
  }, [innerW, innerH, students, fit, r]);

  // 2. mode: zoom OR brush – the cleanup removes whichever one was attached.
  useEffect(() => {
    const c = chart.current;
    if (!c || innerW === 0) return undefined;
    if (mode === 'zoom') {
      c.zoomRect.call(c.zoom);
      c.reset = () => c.zoomRect.transition().duration(motion(600)).call(c.zoom.transform, d3.zoomIdentity);
      return () => c.zoomRect.interrupt().on('.zoom', null);
    }
    const brush = d3.brush().extent(c.extent).on('start brush end', (event) => {
      const s = event.selection; // [[x0, y0], [x1, y1]] in pixels, or null
      const inBox = (d) => s
        && c.zx(d.hours) >= s[0][0] && c.zx(d.hours) <= s[1][0]
        && c.zy(d.score) >= s[0][1] && c.zy(d.score) <= s[1][1];
      c.dots.classed('d3c-dimmed', (d) => Boolean(s) && !inBox(d)); // live feedback while dragging
      if (event.type !== 'end') return;
      picked.current = s && s.map(([px, py]) => [c.zx.invert(px), c.zy.invert(py)]); // pixels → data
      onSelect(students.filter(inBox)); // React state: only when the drag ends
    });
    const brushG = d3.select(svgRef.current).select('.brush').call(brush);
    // Data units → pixels. brush.move fires the same events as a drag, so the dots dim and the table syncs.
    c.pick = (box) => brushG.call(brush.move, box.map(([h, score]) => [c.zx(h), c.zy(score)]));
    // Back after a resize, a visit to the Code tab or a Quick select? Put the box back over the same students.
    if (picked.current) c.pick(picked.current);
    c.reset = () => brushG.call(brush.clear);
    return () => {
      brush.on('start brush end', null); // stop listening first: clearing must not empty React's selection
      brushG.call(brush.clear).on('.brush', null).selectAll('*').remove(); // brush.clear also resets D3's own state
      c.dots.classed('d3c-dimmed', false);
    };
  }, [mode, innerW, innerH, students, onSelect]);

  // 3. trend line: "draw" it with the stroke-dashoffset trick, or hide it.
  useEffect(() => {
    const trend = d3.select(svgRef.current).select('.trend');
    if (!chart.current || innerW === 0) return undefined;
    if (!showTrend) {
      trend.attr('display', 'none');
      return undefined;
    }
    const length = trend.attr('display', null).node().getTotalLength();
    trend.attr('stroke-dasharray', `${length} ${length}`).attr('stroke-dashoffset', length)
      .transition().duration(motion(900)).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
      .on('end', () => trend.attr('stroke-dasharray', null));
    return () => trend.interrupt();
  }, [showTrend, innerW, innerH]);

  function changeMode(next) {
    if (next === mode) return;
    setMode(next);
    picked.current = null;
    onSelect([]); // a new mode starts with an empty selection
  }

  // Quick select: show the whole plot (the box must not be cut off by a zoom), then brush the box.
  function quickSelect(box) {
    const c = chart.current;
    if (!c) return;
    c.zoomRect.interrupt().call(c.zoom.transform, d3.zoomIdentity); // → redraw() updates c.zx / c.zy
    picked.current = box;
    if (mode === 'brush') c.pick(box);
    else setMode('brush'); // effect 2 attaches the brush and draws picked.current
  }

  return (
    <div>
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Pointer mode">
          <button type="button" className={`btn btn-sm ${mode === 'zoom' ? 'active' : ''}`} aria-pressed={mode === 'zoom'} onClick={() => changeMode('zoom')}>
            <Move size={14} aria-hidden="true" /> Zoom & pan
          </button>
          <button type="button" className={`btn btn-sm ${mode === 'brush' ? 'active' : ''}`} aria-pressed={mode === 'brush'} onClick={() => changeMode('brush')}>
            <SquareDashedMousePointer size={14} aria-hidden="true" /> Brush select
          </button>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => chart.current?.reset?.()}>
          <RotateCcw size={14} aria-hidden="true" /> {mode === 'zoom' ? 'Reset zoom' : 'Clear selection'}
        </button>
        <label className="switch">
          <input type="checkbox" checked={showTrend} onChange={(event) => setShowTrend(event.target.checked)} />
          <span className="switch-track" aria-hidden="true" />
          Trend line
        </label>
        <span className="d3c-hint">
          {mode === 'zoom'
            ? 'Drag to pan (two fingers on touch) · Ctrl/⌘ + scroll to zoom · double-click zooms in'
            : 'Drag a rectangle to select students – they appear in the table below'}
        </span>
      </div>
      {/* No mouse? These buttons brush a ready-made box – the linked table updates just the same,
          and "Clear selection" above removes it again. */}
      <div className="viz-controls" role="group" aria-label="Quick select students">
        <span className="d3c-control-label" aria-hidden="true">Quick select</span>
        {PRESETS.map((preset) => (
          <button key={preset.label} type="button" className="btn btn-sm" onClick={() => quickSelect(preset.box)}>
            {preset.label}
          </button>
        ))}
      </div>
      <ul className="viz-legend" aria-label="Legend">
        {CAMPUSES.map((campus) => (
          <li key={campus}>
            <span className="d3c-dot-key" style={{ background: campusColor(campus) }} aria-hidden="true" />
            {campus}
          </li>
        ))}
        {/* A small "D3 calculates, React renders" piece: the size key uses the chart's own scale r. */}
        <li>
          Size = attendance
          {[50, 75, 100].map((v) => (
            <span key={v} className="d3c-size-key">
              <svg width={2 * r(100) + 2} height={2 * r(100) + 2} aria-hidden="true">
                <circle cx={r(100) + 1} cy={r(100) + 1} r={r(v)} />
              </svg>
              {v}%
            </span>
          ))}
        </li>
      </ul>
      <div className="viz" ref={wrapRef}>
        <svg ref={svgRef} className="d3c-zoomable" width={width} height={height} role="group" aria-label={summary}>
          <defs>
            <clipPath id={clipId}>
              <rect width={innerW} height={innerH} />
            </clipPath>
          </defs>
          <g className="plot" transform={`translate(${M.left},${M.top})`}>
            <text className="viz-axis-title" x={-M.left} y={-14}>Final score</text>
            <text className="viz-axis-title" x={innerW} y={innerH + 36} textAnchor="end">Study hours per week</text>
            <g className="viz-grid grid" />
            <g className="viz-axis x-axis" transform={`translate(0,${innerH})`} />
            <g className="viz-axis y-axis" />
            <rect className="zoom d3c-overlay" width={innerW} height={innerH} style={{ cursor: mode === 'zoom' ? 'grab' : 'crosshair' }} />
            <g clipPath={`url(#${clipId})`} pointerEvents="none">
              <g className="dots" />
              <line className="trend d3c-trend" />
              <circle className="ring d3c-ring" />
            </g>
            <g className="brush d3c-brush" />
          </g>
        </svg>
        <ChartTooltip tip={tip} />
      </div>
    </div>
  );
}
