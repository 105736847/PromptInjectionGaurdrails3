/**
 * MiniHistogram – one small histogram, drawn from the bins FastAPI calculated.
 *
 * Pattern: D3 calculates, React renders. d3.scaleLinear() maps values → pixels and React
 * draws one <path> per bar. Hover a bar – or focus the chart and press ← → – to read it.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';

const H = 112;
const M = { top: 6, right: 4, bottom: 20, left: 4 };
const GAP = 2; // px of air between neighbouring bars
const fmt = (v) => (Math.abs(v) >= 1000 ? d3.format(',.0f')(v) : d3.format('.4~r')(v)); // readout: 76.67, 103,423

/** A bar with a 4px rounded top and a square bottom (it sits flat on the baseline). */
function barPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export default function MiniHistogram({ bins, label }) {
  const [ref, { width }] = useElementSize();
  const [active, setActive] = useState(null); // index of the highlighted bar
  const innerW = Math.max(0, width - M.left - M.right);
  const innerH = H - M.top - M.bottom;

  // If every value is the same, the server sends one bin with x0 === x1 – give it some width.
  const flat = bins[0].x0 === bins.at(-1).x1;
  const low = flat ? bins[0].x0 - 0.5 : bins[0].x0;
  const high = flat ? bins[0].x1 + 0.5 : bins.at(-1).x1;
  const x = d3.scaleLinear([low, high], [0, innerW]);
  const y = d3.scaleLinear([0, d3.max(bins, (b) => b.count)], [innerH, 0]);
  const total = d3.sum(bins, (b) => b.count);
  const shown = active === null ? null : bins[active];

  // Axis labels: the scale's own tickFormat() shows as many decimals as the tick STEP needs
  // (101, 101.5, 102 – a fixed format would print 101.5 as "102", twice).
  // Then drop any tick whose (estimated) label would overlap the one before it.
  const tickLabel = x.tickFormat(5, ',~f');
  const ticks = [];
  let lastRight = -Infinity;
  for (const t of x.ticks(5)) {
    const half = (tickLabel(t).length * 6.5) / 2; // ≈ 6.5 px per character at 11 px
    if (x(t) - half > lastRight + 6) {
      ticks.push(t);
      lastRight = x(t) + half;
    }
  }

  // Which bar is under the pointer? Invert the scale: pixel → value → bin.
  function pick(event) {
    const value = x.invert(event.clientX - event.currentTarget.getBoundingClientRect().left);
    const index = bins.findIndex((b) => value < b.x1);
    setActive(index === -1 ? bins.length - 1 : index);
  }

  function onKeyDown(event) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    setActive((i) => Math.max(0, Math.min(bins.length - 1, (i ?? -1) + step)));
  }

  return (
    <div className="viz rt-hist" ref={ref}>
      {width > 0 && (
        <svg
          width={width} height={H} tabIndex={0} role="img" onKeyDown={onKeyDown} onBlur={() => setActive(null)}
          aria-label={`Histogram of ${label}: ${total} values from ${fmt(low)} to ${fmt(high)}. Use the arrow keys to read each bar.`}
        >
          <g transform={`translate(${M.left},${M.top})`}>
            {bins.map((bin, i) => {
              const x0 = flat ? 0 : x(bin.x0);
              const w = Math.max(1, (flat ? innerW : x(bin.x1) - x0) - GAP);
              return (
                <path
                  key={i} d={barPath(x0 + GAP / 2, y(bin.count), w, innerH - y(bin.count))}
                  style={{ fill: 'var(--chart-1)', opacity: active === null || active === i ? 1 : 0.4 }}
                />
              );
            })}
            <g className="viz-axis">
              <line x2={innerW} y1={innerH} y2={innerH} />
              {ticks.map((t) => (
                // Keep the first/last label inside the chart instead of centring it on the edge.
                <text key={t} x={x(t)} y={innerH + 15} textAnchor={x(t) < 24 ? 'start' : x(t) > innerW - 24 ? 'end' : 'middle'}>
                  {tickLabel(t)}
                </text>
              ))}
            </g>
            <rect width={innerW} height={innerH} fill="transparent" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setActive(null)} />
          </g>
        </svg>
      )}
      <p className="rt-hist-readout" aria-live="polite">
        {shown ? (
          <><strong>{shown.count} rows</strong> · {fmt(shown.x0)} to {fmt(shown.x1)}</>
        ) : (
          `${total} values – hover a bar`
        )}
      </p>
    </div>
  );
}
