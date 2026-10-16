/**
 * SvgVsCanvas – the same zoomable scatter plot, drawn with SVG or with Canvas.
 * Pattern: D3 owns the <g>.
 *
 *   SVG    – one DOM element per point: easy to style, inspect and hover, but
 *            thousands of elements make every redraw (e.g. each zoom step) slow.
 *   Canvas – one bitmap we paint ourselves with the 2D context: tens of thousands
 *            of points stay smooth, but there are no elements to attach events to.
 *
 * Both use the SAME d3 scales and the same d3.zoom. The hover uses d3.Delaunay
 * (find the nearest point) instead of per-element events, so it works for both.
 * Two timings (helpers/frameTiming.js): the JavaScript inside draw(), and the
 * time until the frame is painted – SVG pays again AFTER draw() for style,
 * layout and paint.
 *
 * D3 draws the points <g>, both axes and the canvas; React only adds the hover ring
 * and the tooltip. The zoom is set up once. A plain mouse wheel scrolls the PAGE –
 * only Ctrl/⌘ + wheel (or a two-finger pinch) zooms (helpers/scrollFriendlyZoom.js).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useElementSize from '../../../hooks/useElementSize.js';
import { afterNextPaint, formatMs } from './helpers/frameTiming.js';
import ZoomButtons from './helpers/ZoomButtons.jsx';
import { zoomFilter, wheelDelta } from './helpers/scrollFriendlyZoom.js';
import { ALL_POINTS, TOPICS } from './data/embeddingPoints.js';

const COUNTS = [500, 1000, 2000, 3000, 5000, 10000, 25000, 50000];
const SVG_MAX_INDEX = 3; // 3,000 points – more SVG circles would make zooming sluggish
const M = { top: 12, right: 12, bottom: 28, left: 40 };
const fmt = d3.format(',');
const fmtXY = d3.format('.2f'); // 2 decimals, with a real minus sign (−1.25)

export default function SvgVsCanvas() {
  const colors = useChartTheme(); // canvas needs real colour values, not CSS variables
  const [sizeRef, { width }] = useElementSize();
  const [renderer, setRenderer] = useState('svg');
  const [countIndex, setCountIndex] = useState(2);
  const [timing, setTiming] = useState(null); // { js, frame } in ms
  const [hover, setHover] = useState(null); // { p, sx, sy } – nearest point on screen
  const canvasRef = useRef(null);
  const pointsRef = useRef(null);
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);
  const surfaceRef = useRef(null); // transparent rect that receives zoom + hover
  const zoomRef = useRef(null); // the d3.zoom behaviour (created once)
  const transformRef = useRef(d3.zoomIdentity); // the current zoom transform {k, x, y}
  const drawRef = useRef(() => {}); // the latest draw(), called by the zoom handler
  const cancelTimingRef = useRef(() => {}); // cancels a pending "after next paint" measurement

  const height = Math.round(Math.max(260, Math.min(420, width * 0.55)));
  const innerW = Math.max(0, width - M.left - M.right); // the plot area inside the margins
  const innerH = height - M.top - M.bottom;
  const points = useMemo(() => ALL_POINTS.slice(0, COUNTS[countIndex]), [countIndex]);
  const { x, y } = useMemo(
    () => ({
      x: d3.scaleLinear().domain([-6, 6]).range([M.left, width - M.right]),
      y: d3.scaleLinear().domain([-5.5, 5]).range([height - M.bottom, M.top]),
    }),
    [width, height],
  );
  // The table view: one row per topic – d3.rollups → [[topic, { count, x, y }], …]
  const summary = useMemo(
    () => d3.rollups(points, (v) => ({ count: v.length, x: d3.mean(v, (d) => d.x), y: d3.mean(v, (d) => d.y) }), (d) => d.topic),
    [points],
  );
  // Nearest-point search structure, built once per data/size in UN-zoomed pixels.
  const delaunay = useMemo(() => d3.Delaunay.from(points, (d) => x(d.x), (d) => y(d.y)), [points, x, y]);

  // SETUP (once): the zoom behaviour. Its handler calls whatever draw() is current.
  useEffect(() => {
    const surface = d3.select(surfaceRef.current);
    const zoom = d3
      .zoom()
      .scaleExtent([1, 40])
      // Plain wheel / one finger → the page scrolls; Ctrl/⌘ + wheel, pinch or a drag → the chart zooms/pans.
      .filter(zoomFilter)
      .wheelDelta(wheelDelta) // one wheel notch = at most ×1.23, even while Ctrl is held
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        setHover(null);
        drawRef.current();
      });
    surface.call(zoom);
    zoomRef.current = zoom;
    return () => surface.interrupt().on('.zoom', null);
  }, []);

  // UPDATE: (re)draw when the data, renderer, size or theme changes.
  useEffect(() => {
    if (width === 0) return;
    const box = [[M.left, M.top], [width - M.right, height - M.bottom]];
    zoomRef.current.extent(box).translateExtent(box); // can't pan the data out of view
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerW * dpr; // bitmap pixels (sharp on high-DPI screens)
    canvas.height = innerH * dpr;

    function draw() {
      const t0 = performance.now();
      const zx = transformRef.current.rescaleX(x); // zoomed copies of the scales
      const zy = transformRef.current.rescaleY(y);
      d3.select(xAxisRef.current).call(d3.axisBottom(zx).ticks(Math.max(4, width / 100))); // ≥ 4, even on a phone
      d3.select(yAxisRef.current).call(d3.axisLeft(zy).ticks(height / 60));

      // SVG: one <circle> per point (an empty array removes them all in canvas mode).
      d3.select(pointsRef.current)
        .selectAll('circle')
        .data(renderer === 'svg' ? points : [], (d) => d.id)
        .join('circle')
        .attr('class', (d) => `d3-basics-dot-${d.topic}`)
        .attr('r', 3)
        .attr('cx', (d) => zx(d.x))
        .attr('cy', (d) => zy(d.y));

      // Canvas: clear, then paint one path per topic (fewer fillStyle changes = faster).
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, -M.left * dpr, -M.top * dpr); // use the SVG's coordinates
      ctx.clearRect(M.left, M.top, innerW, innerH);
      if (renderer === 'canvas') {
        const r = points.length > 10000 ? 1.5 : 2.5;
        ctx.globalAlpha = 0.85;
        TOPICS.forEach((_, topic) => {
          ctx.fillStyle = colors.categorical[topic];
          ctx.beginPath();
          for (const p of points) {
            if (p.topic !== topic) continue;
            const px = zx(p.x);
            const py = zy(p.y);
            ctx.moveTo(px + r, py);
            ctx.arc(px, py, r, 0, 2 * Math.PI);
          }
          ctx.fill();
        });
      }
      const js = performance.now() - t0; // only OUR code – the browser has not styled or painted anything yet
      cancelTimingRef.current();
      cancelTimingRef.current = afterNextPaint(() => setTiming({ js, frame: performance.now() - t0 }));
    }
    drawRef.current = draw;
    draw();
    return () => cancelTimingRef.current();
  }, [points, renderer, width, height, innerW, innerH, x, y, colors]);

  function handlePointerMove(event) {
    const [mx, my] = d3.pointer(event.nativeEvent, event.currentTarget.ownerSVGElement);
    const t = transformRef.current;
    const p = points[delaunay.find(...t.invert([mx, my]))]; // search in un-zoomed coordinates
    const sx = t.rescaleX(x)(p.x);
    const sy = t.rescaleY(y)(p.y);
    setHover(Math.hypot(sx - mx, sy - my) < 24 ? { p, sx, sy } : null); // 24px hit radius
  }

  function switchRenderer(next) {
    setRenderer(next);
    if (next === 'svg') setCountIndex((i) => Math.min(i, SVG_MAX_INDEX));
  }

  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Renderer">
          {['svg', 'canvas'].map((r) => (
            <button key={r} type="button" className={`btn btn-sm${renderer === r ? ' active' : ''}`} aria-pressed={renderer === r} onClick={() => switchRenderer(r)}>
              {r === 'svg' ? 'SVG' : 'Canvas'}
            </button>
          ))}
        </div>
        <label className="d3-basics-inline-range">
          {fmt(points.length)} points
          <input type="range" min="0" max={renderer === 'svg' ? SVG_MAX_INDEX : COUNTS.length - 1} value={countIndex}
            onChange={(e) => setCountIndex(Number(e.target.value))} aria-valuetext={`${fmt(points.length)} points`} />
        </label>
        {/* Keyboard users cannot scroll-zoom: buttons drive the same d3.zoom behaviour */}
        <ZoomButtons zoomRef={zoomRef} targetRef={surfaceRef} />
      </div>

      <ul className="viz-legend" aria-label="Legend">
        {TOPICS.map((topic, i) => (
          <li key={topic}><span className="viz-swatch" style={{ background: `var(--chart-${i + 1})` }} />{topic}</li>
        ))}
      </ul>

      <div ref={sizeRef} className="viz d3-basics-scatter" style={{ height }}>
        <canvas ref={canvasRef} className="d3-basics-canvas" aria-hidden="true" style={{ left: M.left, top: M.top, width: innerW, height: innerH }} />
        {/* role="group", not "img": the chart is interactive (zoom, pan, hover) */}
        <svg width={width} height={height} role="group" aria-label={`Zoomable scatter plot of ${fmt(points.length)} forum posts in three topic clusters, drawn with ${renderer === 'svg' ? 'SVG' : 'Canvas'}`}>
          <g transform={`translate(0,${height - M.bottom})`}><g ref={xAxisRef} className="viz-axis" /></g>
          <g transform={`translate(${M.left},0)`}><g ref={yAxisRef} className="viz-axis" /></g>
          {/* A nested <svg> clips everything outside its box – the points never cover the axes */}
          <svg x={M.left} y={M.top} width={innerW} height={innerH} viewBox={`${M.left} ${M.top} ${Math.max(1, innerW)} ${innerH}`} className="d3-basics-clip">
            <g ref={pointsRef} />
          </svg>
          {hover && <circle className="d3-basics-hover-ring" cx={hover.sx} cy={hover.sy} r={7} />}
          <rect ref={surfaceRef} className="d3-basics-zoom-surface" x={M.left} y={M.top} width={innerW} height={innerH}
            onPointerMove={handlePointerMove} onPointerLeave={() => setHover(null)} />
        </svg>
        {hover && (
          <div className={`viz-tooltip d3-basics-tip-above${hover.sx > width - 120 ? ' is-right' : hover.sx < 120 ? ' is-left' : ''}`} style={{ left: hover.sx, top: hover.sy - 10 }}>
            <div className="viz-tooltip-title">Post #{hover.p.id}</div>
            <div className="viz-tooltip-row">
              <span className="viz-swatch" style={{ background: `var(--chart-${hover.p.topic + 1})` }} />
              {TOPICS[hover.p.topic]} <strong>({fmtXY(hover.p.x)}, {fmtXY(hover.p.y)})</strong>
            </div>
          </div>
        )}
      </div>

      <ul className="d3-basics-stats d3-basics-timings">
        <li className="card"><span className="small muted">JavaScript in draw()</span><strong>{formatMs(timing?.js)}</strong></li>
        <li className="card"><span className="small muted">Until the frame is painted</span><strong>{formatMs(timing?.frame)}</strong></li>
        <li className="card">
          <span className="small muted">DOM elements for the points</span>
          <strong>{renderer === 'svg' ? fmt(points.length) : 1} <code>{renderer === 'svg' ? '<circle>' : '<canvas>'}</code></strong>
        </li>
      </ul>
      <p className="small muted m-0">
        Ctrl/⌘ + scroll to zoom (pinch with two fingers on a touch screen, or use the buttons); drag to pan; hover a dot for
        details. The gap between the two timings is the browser styling, laying out and painting – large for thousands of
        &lt;circle&gt;s, small for one canvas. The painted time also waits for the next screen refresh, so animated zooms
        can&apos;t go below about one frame (≈ 16.7 ms at 60 Hz) – that floor is the screen&apos;s, not the chart&apos;s.
      </p>

      {/* A canvas is invisible to screen readers: summarise the points as a table */}
      <details className="d3-basics-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption>The {fmt(points.length)} points drawn, per topic (un-zoomed)</caption>
            <thead>
              <tr><th scope="col">Topic</th><th scope="col" className="num">Points</th><th scope="col" className="num">Mean x</th><th scope="col" className="num">Mean y</th></tr>
            </thead>
            <tbody>
              {summary.map(([topic, s]) => (
                <tr key={topic}>
                  <th scope="row">{TOPICS[topic]}</th>
                  <td className="num">{fmt(s.count)}</td>
                  <td className="num">{fmtXY(s.x)}</td>
                  <td className="num">{fmtXY(s.y)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
