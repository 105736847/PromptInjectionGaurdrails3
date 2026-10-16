/**
 * ChartTooltip – a floating card placed next to a point inside a `.viz` wrapper
 * (which is position: relative). It measures itself after rendering
 * (useLayoutEffect runs before the browser paints) and flips to the left of the
 * point when there is no room on the right, so it never leaves the chart.
 *
 *   <ChartTooltip x={120} y={40} width={chartWidth} title="0.40 – 0.45">
 *     <TooltipRow color="var(--chart-1)" label="URLs" value="12" />
 *   </ChartTooltip>
 */
import { useLayoutEffect, useRef, useState } from 'react';

const GAP = 12;

export default function ChartTooltip({ x, y, width, title, children }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 160, h: 60 });

  useLayoutEffect(() => {
    const { offsetWidth: w, offsetHeight: h } = ref.current;
    setSize((s) => (s.w === w && s.h === h ? s : { w, h })); // same object → no extra render
  });

  const fitsRight = x + GAP + size.w <= width;
  const left = fitsRight ? x + GAP : Math.max(0, x - GAP - size.w);
  const top = Math.max(0, y - size.h / 2);

  return (
    <div ref={ref} className="viz-tooltip" style={{ left, top, width: 'max-content', maxWidth: Math.min(260, width) }}>
      {title && <div className="viz-tooltip-title">{title}</div>}
      {children}
    </div>
  );
}

/** One row: [colour key] label ……… value (the value is the strongest thing). */
export function TooltipRow({ color, label, value }) {
  return (
    <div className="viz-tooltip-row">
      {color && <span className="viz-swatch" style={{ background: color }} />}
      <span className="mlserve-tip-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
