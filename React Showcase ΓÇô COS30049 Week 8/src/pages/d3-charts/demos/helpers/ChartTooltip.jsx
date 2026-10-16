/**
 * ChartTooltip – the one tooltip every chart on this page uses.
 * D3 handles the pointer, React renders the tooltip:
 *
 *   const [tip, setTip] = useState(null);
 *   // inside a D3 event handler:
 *   setTip({ x, y, title: 'Week 6', rows: [{ key: 'line', color: 'var(--chart-4)', label: 'Cloud', value: '312' }] });
 *   <div className="viz"><svg>…</svg><ChartTooltip tip={tip} /></div>
 *
 * Same layout everywhere: a muted title, then one row per value –
 * key (a line for lines, a swatch for areas / bars / cells, a dot for dots) + label + value in bold.
 * x / y are pixels inside the .viz wrapper. After React renders the box we measure it
 * (useLayoutEffect runs before the browser paints) and flip / clamp it so it never
 * leaves the chart. Text goes in as JSX, so data is never injected as HTML.
 */
import { useLayoutEffect, useRef } from 'react';

const KEY_CLASS = { line: 'viz-key-line', swatch: 'viz-swatch', dot: 'd3c-dot-key' };

export default function ChartTooltip({ tip }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !tip) return;
    const parent = el.offsetParent; // the .viz wrapper (position: relative)
    const maxX = (parent?.clientWidth ?? 0) - el.offsetWidth;
    const maxY = (parent?.clientHeight ?? 0) - el.offsetHeight;
    let x = tip.x + 14;
    if (x > maxX) x = tip.x - 14 - el.offsetWidth; // no room on the right → show it on the left
    const y = tip.y - el.offsetHeight / 2;
    el.style.transform = `translate(${Math.max(0, Math.min(x, maxX))}px, ${Math.max(0, Math.min(y, maxY))}px)`;
  });

  if (!tip) return null;
  return (
    <div ref={ref} className="viz-tooltip d3c-tooltip" aria-hidden="true">
      <div className="viz-tooltip-title">{tip.title}</div>
      {tip.rows.map((row) => (
        <div key={row.label} className={`viz-tooltip-row ${row.active ? 'd3c-tooltip-active' : ''}`}>
          {row.color && <span className={KEY_CLASS[row.key ?? 'line']} style={{ background: row.color }} />}
          <span className="d3c-tooltip-label">{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}
