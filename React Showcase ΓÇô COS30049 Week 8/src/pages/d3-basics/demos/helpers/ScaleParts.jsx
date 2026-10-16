/**
 * ScaleParts.jsx – small SVG building blocks shared by the scale diagrams:
 * a Ruler (axis line + ticks), a DragBand (invisible strip you can drag on),
 * a Flag (value label that stays inside the chart) and a Marker (the blue,
 * keyboard-accessible handle). Plain React + SVG.
 */
import * as d3 from 'd3';

export const LAYOUT = { height: 240, pad: 30, top: 54, bottom: 180 };

/** Axis line with tick labels above (side="top") or below (side="bottom"). */
export function Ruler({ y, width, ticks, position, format, side, highlight }) {
  const dir = side === 'top' ? -1 : 1;
  return (
    <g className="viz-axis">
      <line x1={LAYOUT.pad} x2={width - LAYOUT.pad} y1={y} y2={y} />
      {/* the part of the ruler that is the real domain/range is drawn thicker */}
      {highlight && <line className="d3-basics-ruler-core" x1={highlight[0]} x2={highlight[1]} y1={y} y2={y} />}
      {ticks.map((t, i) => (
        <g key={i} transform={`translate(${position(t)},${y})`}>
          <line y2={5 * dir} />
          <text y={side === 'top' ? -10 : 18} textAnchor="middle">
            {format(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** An invisible strip over a ruler: press and drag anywhere on it. */
export function DragBand({ y, width, onPixel }) {
  function handle(event) {
    // d3.pointer → [x, y] of the event relative to the <svg> (handles CSS scaling too)
    const [px] = d3.pointer(event.nativeEvent, event.currentTarget.ownerSVGElement);
    onPixel(Math.max(LAYOUT.pad, Math.min(width - LAYOUT.pad, px)));
  }
  return (
    <rect
      className="d3-basics-drag-band"
      x={0}
      y={y - 24}
      width={width}
      height={44}
      aria-hidden="true"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId); // keep receiving moves outside the strip
        handle(e);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && handle(e)}
    />
  );
}

/** A value label that stays inside the chart: left-aligned near the left edge, right-aligned near the right. */
export function Flag({ x, y, width, children }) {
  const anchor = x < 90 ? 'start' : x > width - 90 ? 'end' : 'middle';
  const dx = anchor === 'start' ? -8 : anchor === 'end' ? 8 : 0;
  return (
    <text className="d3-basics-flag" x={x + dx} y={y} textAnchor={anchor}>
      {children}
    </text>
  );
}

/**
 * The draggable handle. Keyboard: ←/→ move it by 1 % of the width (Shift: 10 %).
 * onNudge(pixelDelta) lets the parent decide what a move means.
 */
export function Marker({ x, y, width, label, side, ariaLabel, valueNow, valueText, onNudge }) {
  function handleKey(event) {
    const step = (event.shiftKey ? 0.1 : 0.01) * width;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') onNudge(-step);
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') onNudge(step);
    else return;
    event.preventDefault(); // don't scroll the page
  }
  return (
    <>
      <g
        className="d3-basics-marker"
        transform={`translate(${x},${y})`}
        tabIndex={0}
        role="slider"
        aria-label={ariaLabel}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
        onKeyDown={handleKey}
      >
        <circle r={7} />
      </g>
      <Flag x={x} y={y + (side === 'top' ? -30 : 42)} width={width}>
        {label}
      </Flag>
    </>
  );
}
