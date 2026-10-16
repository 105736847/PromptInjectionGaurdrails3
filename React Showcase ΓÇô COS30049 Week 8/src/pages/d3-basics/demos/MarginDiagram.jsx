/**
 * MarginDiagram – a labelled sketch of D3's "margin convention".
 *
 *   The <svg> is width × height. We shift an inner <g> by (margin.left, margin.top)
 *   and draw the data inside innerWidth × innerHeight. The margins are the space
 *   left over for axes, tick labels and titles.
 *
 * Pattern: D3 calculates, React renders.
 * Here not even D3 is needed: the margin maths is plain arithmetic, JSX draws it.
 * The margins are drawn at half size (so small values stay visible).
 */
import { useId } from 'react';

const BOX = { x: 26, y: 30, w: 236, h: 150 }; // the outer <svg> in sketch units

/** A double-headed arrow: marker-start + marker-end (orient="auto-start-reverse" flips the start one). */
function Arrow({ markerId, x1, y1, x2, y2 }) {
  const url = `url(#${markerId})`;
  return <line className="d3-basics-arrow" x1={x1} y1={y1} x2={x2} y2={y2} markerStart={url} markerEnd={url} />;
}

export default function MarginDiagram({ width, height, margin }) {
  // useId() gives a unique id per instance; strip characters that are awkward inside url(#…)
  const arrowId = `arrow-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const k = 0.5;
  const m = {
    top: Math.max(8, margin.top * k),
    right: Math.max(8, margin.right * k),
    bottom: Math.max(8, margin.bottom * k),
    left: Math.max(8, margin.left * k),
  };
  const inner = { x: BOX.x + m.left, y: BOX.y + m.top, w: BOX.w - m.left - m.right, h: BOX.h - m.top - m.bottom };
  const midX = inner.x + inner.w / 2;
  const midY = inner.y + inner.h / 2;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  return (
    <svg className="d3-basics-margin-diagram" viewBox="0 0 300 214" role="img"
      aria-label={`Margin convention: svg ${width} by ${height}, margins top ${margin.top}, right ${margin.right}, bottom ${margin.bottom}, left ${margin.left}, inner area ${innerWidth} by ${innerHeight}`}>
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0L10,5L0,10z" style={{ fill: 'var(--color-text-muted)' }} />
        </marker>
      </defs>

      {/* the whole <svg> – its margins are shaded */}
      <rect className="d3-basics-margin-outer" x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={4} />
      {/* the inner <g> where the data goes */}
      <rect className="d3-basics-margin-inner" x={inner.x} y={inner.y} width={inner.w} height={inner.h} />
      <circle className="d3-basics-margin-origin" cx={inner.x} cy={inner.y} r={3} />
      <text className="d3-basics-margin-note" x={inner.x + 6} y={inner.y + 12}>(0,0) of the inner &lt;g&gt;</text>
      <text className="d3-basics-margin-label" x={midX} y={midY + 4} textAnchor="middle">
        {innerWidth} × {innerHeight}
      </text>
      <text className="d3-basics-margin-note" x={midX} y={midY + 18} textAnchor="middle">innerWidth × innerHeight</text>

      {/* outer size */}
      <Arrow markerId={arrowId} x1={BOX.x} y1={16} x2={BOX.x + BOX.w} y2={16} />
      <text className="d3-basics-margin-label" x={BOX.x + BOX.w / 2} y={11} textAnchor="middle">width = {width}</text>
      <Arrow markerId={arrowId} x1={BOX.x + BOX.w + 12} y1={BOX.y} x2={BOX.x + BOX.w + 12} y2={BOX.y + BOX.h} />
      <text className="d3-basics-margin-label" transform={`translate(${BOX.x + BOX.w + 26},${BOX.y + BOX.h / 2}) rotate(90)`} textAnchor="middle">
        height = {height}
      </text>

      {/* the four margins */}
      <Arrow markerId={arrowId} x1={midX} y1={BOX.y} x2={midX} y2={inner.y} />
      <text className="d3-basics-margin-note" x={midX + 5} y={BOX.y + m.top / 2 + 3}>top {margin.top}</text>
      <Arrow markerId={arrowId} x1={midX} y1={inner.y + inner.h} x2={midX} y2={BOX.y + BOX.h} />
      <text className="d3-basics-margin-note" x={midX + 5} y={inner.y + inner.h + m.bottom / 2 + 3}>bottom {margin.bottom}</text>
      <Arrow markerId={arrowId} x1={BOX.x} y1={inner.y + inner.h - 14} x2={inner.x} y2={inner.y + inner.h - 14} />
      <text className="d3-basics-margin-note" x={inner.x + 4} y={inner.y + inner.h - 11}>← left {margin.left}</text>
      <Arrow markerId={arrowId} x1={inner.x + inner.w} y1={inner.y + inner.h - 14} x2={BOX.x + BOX.w} y2={inner.y + inner.h - 14} />
      <text className="d3-basics-margin-note" x={inner.x + inner.w - 4} y={inner.y + inner.h - 11} textAnchor="end">right {margin.right} →</text>

      <text className="d3-basics-margin-note" x={BOX.x} y={206}>
        {`<g transform="translate(${margin.left},${margin.top})">`}
      </text>
    </svg>
  );
}
