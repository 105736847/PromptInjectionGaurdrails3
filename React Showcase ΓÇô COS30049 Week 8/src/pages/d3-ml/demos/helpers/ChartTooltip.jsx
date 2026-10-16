/**
 * ChartTooltip – the floating card used by the charts on this page.
 *
 * Plain React/HTML (not SVG), absolutely positioned inside the chart's `.viz`
 * wrapper (position: relative). It MEASURES itself in useLayoutEffect – after
 * React has put it in the DOM, before the browser paints – and then keeps the
 * whole card inside the chart: it never pokes out of the card on a phone and
 * never covers the chart's caption above the plot.
 *
 *   <ChartTooltip x={120} y={80} width={chartWidth} title="Epoch 12">
 *     <TooltipRow keyType="line" color="var(--chart-1)" label="LogReg" value="0.41" />
 *   </ChartTooltip>
 *
 * Every tooltip on this page has the SAME layout: a muted title, then one
 * TooltipRow per value – key (line for lines, swatch for bars / cells / dots),
 * label, and the value last, in bold (the strongest thing in the row).
 *
 * placement: 'side' (default) = beside the point (right if it fits, else left),
 *            vertically centred on y. On a narrow chart where neither side has
 *            room, it moves under (or over) the point instead.
 *            'below' / 'above' = under / over y, so the ROW being hovered stays visible.
 * Keep `title` short: it stays on ONE line. Details belong in the rows.
 */
import { useLayoutEffect, useRef, useState } from 'react';

const GAP = 14; // px between the point and the card
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function ChartTooltip({ x, y, width, title, placement = 'side', children }) {
  const cardRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0, chartH: 0 }); // card size + chart (wrapper) height

  // No dependency array: re-measure after every render, because the content may have changed.
  // Returning the SAME object when nothing changed lets React skip the extra render.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const next = { w: card.offsetWidth, h: card.offsetHeight, chartH: card.offsetParent?.clientHeight ?? 0 };
    setSize((s) => (s.w === next.w && s.h === next.h && s.chartH === next.chartH ? s : next));
  });

  const { w, h, chartH } = size;
  let side = placement;
  let left;
  if (placement === 'side') {
    if (x + GAP + w <= width) left = x + GAP; // right of the point…
    else if (x - GAP - w >= 0) left = x - GAP - w; // …or left of it…
    else side = y > chartH / 2 ? 'above' : 'below'; // …or neither fits: go over / under it
  }
  left ??= clamp(x - w / 2, 0, Math.max(0, width - w)); // centred on x, inside the chart
  const offset = placement === 'side' ? GAP : 0; // explicit below/above: the caller already left a gap
  const top = side === 'side'
    ? clamp(y - h / 2, 0, Math.max(0, chartH - h)) // never above the plot's top edge (= the caption)
    : side === 'below' ? y + offset : y - h - offset;

  return (
    <div ref={cardRef} className="viz-tooltip"
      style={{ left, top, width: 'max-content', maxWidth: Math.min(300, width) }}>
      {title && <div className="viz-tooltip-title d3ml-tooltip-title">{title}</div>}
      {children}
    </div>
  );
}

/**
 * One tooltip row: [key] label (detail) ……… VALUE.
 * `color` draws the key (leave it out when the row has no series colour; use
 * 'transparent' to keep the row lined up with rows that DO have a key);
 * `detail` is an optional muted note after the label, e.g. "(train 0.21)".
 */
export function TooltipRow({ color, keyType = 'swatch', label, detail, value }) {
  return (
    <div className="viz-tooltip-row">
      {color && <span className={keyType === 'line' ? 'viz-key-line' : 'viz-swatch'} style={{ background: color }} />}
      <span className="d3ml-tip-label">{label}{detail && <span className="subtle"> {detail}</span>}</span>
      <strong className="d3ml-tip-value">{value}</strong>
    </div>
  );
}
