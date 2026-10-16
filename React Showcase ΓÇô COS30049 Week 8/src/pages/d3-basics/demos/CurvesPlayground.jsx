/**
 * CurvesPlayground – d3-shape line & area generators, curve factories and d3-drag.
 * Pattern: mixed – d3.line()/d3.area() compute path strings that JSX renders;
 * D3 owns the <g> of drag handles (d3.drag → setPoints → React re-renders the curve).
 *
 * Drag the dots (or focus one with Tab and use the arrow keys). Each handle is a
 * role="slider" whose aria-valuetext reads both coordinates, e.g. "Point 3: x 29, y 72".
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';

const HEIGHT = 300;
const M = { top: 20, right: 24, bottom: 20, left: 24 };
const START = [0.12, 0.3, 0.72, 0.45, 0.2, 0.62, 0.85, 0.5].map((y, i, all) => ({ x: i / (all.length - 1), y }));
// A curve factory decides how the pen travels between points. Some take a parameter.
const CURVES = {
  curveLinear: () => d3.curveLinear,
  curveStep: () => d3.curveStep,
  curveMonotoneX: () => d3.curveMonotoneX,
  curveBasis: () => d3.curveBasis,
  curveCardinal: (p) => d3.curveCardinal.tension(p.tension),
  curveCatmullRom: (p) => d3.curveCatmullRom.alpha(p.alpha),
  curveNatural: () => d3.curveNatural,
  curveBumpX: () => d3.curveBumpX,
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Returns a NEW array with point i moved to pixel (px, py); x stays between its neighbours. */
function movePoint(points, i, px, py, { x, y }) {
  return points.map((p, j) => {
    if (j !== i) return p;
    const lo = i === 0 ? 0 : points[i - 1].x + 0.02;
    const hi = i === points.length - 1 ? 1 : points[i + 1].x - 0.02;
    return { x: clamp(x.invert(px), lo, hi), y: clamp(y.invert(py), 0, 1) };
  });
}

export default function CurvesPlayground() {
  const id = useId();
  const gradientId = `fill-${id.replace(/[^a-zA-Z0-9-]/g, '')}`; // safe inside url(#…)
  const [points, setPoints] = useState(START); // in 0–1 "data units", so resizing keeps the shape
  const [curveName, setCurveName] = useState('curveMonotoneX');
  const [params, setParams] = useState({ tension: 0, alpha: 0.5 });
  const [showArea, setShowArea] = useState(true);
  const [sizeRef, { width }] = useElementSize();
  const handlesRef = useRef(null);
  const scalesRef = useRef(null); // the latest scales, for the drag handlers below

  // SETUP (once): the drag behaviour. Re-creating it on every render would break a drag
  // in progress (each behaviour tracks its own gestures), so useState keeps the first one.
  // Its handlers only use stable things: setPoints and a ref.
  const [drag] = useState(() =>
    d3
      .drag()
      .subject((event, d) => ({ x: scalesRef.current.x(d.x), y: scalesRef.current.y(d.y) })) // drag in pixels
      .on('start', function () { d3.select(this).classed('is-dragging', true); })
      .on('drag', (event, d) => setPoints((prev) => movePoint(prev, d.i, event.x, event.y, scalesRef.current)))
      .on('end', function () { d3.select(this).classed('is-dragging', false); }),
  );

  // Scales: the domain defaults to [0, 1] – exactly our data units.
  const x = d3.scaleLinear().range([M.left, width - M.right]);
  const y = d3.scaleLinear().range([HEIGHT - M.bottom, M.top]);
  const curve = CURVES[curveName](params);
  // Generators: functions that turn an array of points into an SVG path string.
  const line = d3.line((d) => x(d.x), (d) => y(d.y)).curve(curve);
  const area = d3.area((d) => x(d.x), y(0), (d) => y(d.y)).curve(curve);
  const pathD = width > 0 ? line(points) : '';

  // UPDATE: D3 owns the handles – join one <g> per point and attach the drag behaviour.
  useEffect(() => {
    if (width === 0) return undefined;
    scalesRef.current = { x, y };
    const handles = d3
      .select(handlesRef.current)
      .selectAll('g')
      .data(points.map((p, i) => ({ ...p, i })), (d) => d.i) // key = index: point i keeps its <g>
      .join((enter) => {
        const g = enter.append('g').attr('class', 'd3-basics-handle').attr('tabindex', 0).attr('role', 'slider');
        g.append('circle').attr('class', 'd3-basics-hit').attr('r', 14); // invisible 28px hit target – easy to grab with a finger
        g.append('circle').attr('class', 'd3-basics-handle-dot').attr('r', 7); // the dot you see
        return g;
      })
      .attr('transform', (d) => `translate(${x(d.x)},${y(d.y)})`)
      // Slider semantics: the value is the height (0–100); valuetext also says where the point is across.
      .attr('aria-label', (d) => `Point ${d.i + 1}, use the arrow keys to move`)
      .attr('aria-valuemin', 0)
      .attr('aria-valuemax', 100)
      .attr('aria-valuenow', (d) => Math.round(d.y * 100))
      .attr('aria-valuetext', (d) => `Point ${d.i + 1}: x ${Math.round(d.x * 100)}, y ${Math.round(d.y * 100)}`)
      .call(drag)
      .on('keydown', (event, d) => {
        const step = { ArrowUp: [0, -8], ArrowDown: [0, 8], ArrowLeft: [-8, 0], ArrowRight: [8, 0] }[event.key];
        if (!step) return;
        event.preventDefault(); // don't scroll the page
        setPoints((prev) => movePoint(prev, d.i, x(d.x) + step[0], y(d.y) + step[1], { x, y }));
      });

    return () => handles.on('.drag', null).on('keydown', null); // remove D3's listeners
  }); // no dependency array: re-join after EVERY render (cheap – only 8 circles)

  const code = `d3.line(d => x(d.x), d => y(d.y)).curve(d3.${curveName}${
    curveName === 'curveCardinal' ? `.tension(${params.tension})` : curveName === 'curveCatmullRom' ? `.alpha(${params.alpha})` : ''
  })`;

  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="field">
          <label className="label" htmlFor={`${id}-curve`}>Curve</label>
          <select id={`${id}-curve`} className="input mono" value={curveName} onChange={(e) => setCurveName(e.target.value)}>
            {Object.keys(CURVES).map((name) => <option key={name} value={name}>d3.{name}</option>)}
          </select>
        </div>
        {curveName === 'curveCardinal' && (
          <div className="field">
            <label className="label" htmlFor={`${id}-t`}>tension({params.tension})</label>
            <input id={`${id}-t`} type="range" min="0" max="1" step="0.05" value={params.tension}
              onChange={(e) => setParams({ ...params, tension: Number(e.target.value) })} />
          </div>
        )}
        {curveName === 'curveCatmullRom' && (
          <div className="field">
            <label className="label" htmlFor={`${id}-a`}>alpha({params.alpha})</label>
            <input id={`${id}-a`} type="range" min="0" max="1" step="0.05" value={params.alpha}
              onChange={(e) => setParams({ ...params, alpha: Number(e.target.value) })} />
          </div>
        )}
        <label className="switch">
          <input type="checkbox" checked={showArea} onChange={(e) => setShowArea(e.target.checked)} />
          <span className="switch-track" /> d3.area fill
        </label>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPoints(START)}>
          <RotateCcw size={15} aria-hidden="true" /> Reset
        </button>
      </div>

      <div ref={sizeRef} className="viz d3-basics-curve-stage">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="group" aria-label={`Editable ${curveName} through ${points.length} points`}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--chart-1)', stopOpacity: 0.22 }} />
                <stop offset="100%" style={{ stopColor: 'var(--chart-1)', stopOpacity: 0.02 }} />
              </linearGradient>
            </defs>
            <line className="d3-basics-baseline" x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
            {showArea && <path d={area(points)} style={{ fill: `url(#${gradientId})` }} />}
            {/* the "control polygon": straight lines between the raw points */}
            <path className="d3-basics-polygon" d={d3.line((d) => x(d.x), (d) => y(d.y))(points)} />
            <path className="d3-basics-line" d={pathD} />
            <g ref={handlesRef} />
          </svg>
        )}
      </div>

      <pre className="demo-output">
        {`${code}(points)\n\n→ "${pathD.slice(0, 150)}${pathD.length > 150 ? '…' : ''}"\n   (${pathD.length} characters of SVG path data)`}
      </pre>
    </div>
  );
}
