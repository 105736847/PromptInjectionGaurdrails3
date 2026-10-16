/**
 * MetricCurve – one component for BOTH the ROC curve and the precision–recall
 * curve: the same chart with different keys (a nice example of props!).
 *
 * Pattern: D3 calculates, React renders
 * d3.line / d3.area turn the points into SVG path strings; the operating
 * point moves with a CSS transition.
 * Click anywhere on the curve to move the threshold there (linked views work
 * in both directions).
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from '../helpers/ChartTooltip.jsx';
import { pct0 } from '../helpers/chart.js';

const M = { top: 12, right: 14, bottom: 42, left: 54 };

export default function MetricCurve({ title, points, xKey, yKey, xLabel, yLabel, operating, reference, summary, curve, onPick }) {
  const [ref, { width }] = useElementSize();
  const [hover, setHover] = useState(null); // the curve point nearest to the pointer

  const height = Math.round(Math.min(300, Math.max(220, width * 0.8)));
  const x = d3.scaleLinear([0, 1], [M.left, width - M.right]);
  const y = d3.scaleLinear([0, 1], [height - M.bottom, M.top]);

  // Shape generators: accessor functions in, an SVG "d" string out.
  const line = d3.line().x((d) => x(d[xKey])).y((d) => y(d[yKey])).curve(curve);
  const area = d3.area().x((d) => x(d[xKey])).y0(y(0)).y1((d) => y(d[yKey])).curve(curve);

  // The curve point nearest to a pointer event. d3.least returns the element with
  // the smallest value – here: the pixel distance.
  function nearest(event) {
    const [px, py] = d3.pointer(event.nativeEvent, event.currentTarget);
    return d3.least(points, (d) => Math.hypot(x(d[xKey]) - px, y(d[yKey]) - py));
  }
  const showNearest = (event) => setHover(nearest(event));

  const ox = x(operating[xKey]);
  const oy = y(operating[yKey]);
  const diagonalAngle = (Math.atan2(y(1) - y(0), x(1) - x(0)) * 180) / Math.PI; // on screen, in degrees

  return (
    <figure className="d3ml-figure">
      <figcaption className="d3ml-figure-title">{title} <span className="d3ml-figure-note">· {summary}</span></figcaption>
      <div className="viz" ref={ref}>
        {width > 0 && (
          // role="group", not "img": the chart is clickable, and "img" would hide that from assistive tech.
          <svg width={width} height={height} role="group"
            aria-label={`${title}. ${summary}. Current operating point: ${xLabel} ${pct0(operating[xKey])}, ${yLabel} ${pct0(operating[yKey])}.`}
            onPointerMove={showNearest} onPointerDown={showNearest} onPointerLeave={() => setHover(null)}
            // Use the click's own position, not `hover`: after a TAP the browser fires
            // pointerleave (clearing hover) before click.
            onClick={(event) => onPick(nearest(event).threshold)} style={{ cursor: 'crosshair' }}>
            <g className="viz-grid">
              {x.ticks(5).map((t) => <line key={`x${t}`} x1={x(t)} x2={x(t)} y1={M.top} y2={height - M.bottom} />)}
              {y.ticks(5).map((t) => <line key={`y${t}`} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />)}
            </g>
            <g className="viz-axis">
              {x.ticks(5).map((t) => <text key={t} x={x(t)} y={height - M.bottom + 16} textAnchor="middle">{pct0(t)}</text>)}
              {y.ticks(5).map((t) => <text key={t} x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{pct0(t)}</text>)}
            </g>
            <text className="viz-axis-title" x={(M.left + width - M.right) / 2} y={height - 6} textAnchor="middle">{xLabel}</text>
            <text className="viz-axis-title" transform={`translate(12,${(M.top + height - M.bottom) / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>

            {/* Reference line: what a coin-flip model would score */}
            {reference.type === 'diagonal' ? (
              <line className="d3ml-reference" x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} />
            ) : (
              <line className="d3ml-reference" x1={x(0)} x2={x(1)} y1={y(reference.y)} y2={y(reference.y)} />
            )}
            {reference.type === 'diagonal' ? (
              // Rotated to run ALONG the diagonal, just below it – clearly that line's label.
              <text className="viz-label-muted" textAnchor="middle" dy={14}
                transform={`translate(${x(0.62)},${y(0.62)}) rotate(${diagonalAngle})`}>{reference.label}</text>
            ) : (
              <text className="viz-label-muted" x={x(0.03)} y={y(reference.y) - 6}>{reference.label}</text>
            )}

            {/* Shaded area (10% wash) + the 2px curve */}
            <path d={area(points)} style={{ fill: 'var(--chart-3)', opacity: 0.1 }} />
            <path d={line(points)} style={{ fill: 'none', stroke: 'var(--chart-3)', strokeWidth: 2, strokeLinejoin: 'round' }} />

            {/* The operating point for the current threshold, with guide lines to both axes */}
            <g className="d3ml-operating">
              <line x1={M.left} x2={ox} y1={oy} y2={oy} />
              <line x1={ox} x2={ox} y1={oy} y2={height - M.bottom} />
            </g>
            <circle className="d3ml-point" r={6} style={{ transform: `translate(${ox}px, ${oy}px)` }} />

            {hover && <circle className="d3ml-ghost" r={5} cx={x(hover[xKey])} cy={y(hover[yKey])} />}
          </svg>
        )}
        {hover && (
          <ChartTooltip x={x(hover[xKey])} y={y(hover[yKey])} width={width} title={`Threshold ${hover.threshold.toFixed(3)}`}>
            <TooltipRow label={yLabel} value={pct0(hover[yKey])} />
            <TooltipRow label={xLabel} value={pct0(hover[xKey])} />
          </ChartTooltip>
        )}
      </div>
    </figure>
  );
}
