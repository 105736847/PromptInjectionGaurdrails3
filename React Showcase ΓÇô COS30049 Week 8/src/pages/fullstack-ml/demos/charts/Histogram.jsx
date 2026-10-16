/**
 * Histogram – how many values fall into each bin (probabilities, latencies…).
 * Pattern: D3 calculates, React renders
 *
 *   <Histogram values={[0.1, 0.8, …]} domain={[0, 1]} bins={20} marker={0.5} markerLabel="threshold" />
 *
 * d3.bin() groups the numbers; scales turn bins and counts into pixels; React
 * draws one <path> per bin. Used by the batch demo AND the latency demo.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './ChartTooltip.jsx';
import { columnPath } from './chartUtils.js';

const MARGIN = { top: 22, right: 12, bottom: 40, left: 40 };

export default function Histogram({
  values, domain, bins = 20, height = 220, marker = null, markerLabel = '',
  format = d3.format('.0%'), xLabel = '', yLabel = 'count', label = 'Histogram', color = 'var(--chart-1)',
}) {
  const [ref, { width }] = useElementSize();
  // Remember WHICH bin is hovered (its index), not the bin object: when new values arrive
  // while the mouse is still over the chart, the tooltip then reads the new bins – never old ones.
  const [hoverIndex, setHoverIndex] = useState(null);

  // Explicit, evenly spaced thresholds → the same bins every time, whatever the data.
  const step = (domain[1] - domain[0]) / bins;
  const binned = d3.bin().domain(domain).thresholds(d3.range(1, bins).map((i) => domain[0] + i * step))(values);

  const x = d3.scaleLinear().domain(domain).range([MARGIN.left, width - MARGIN.right]);
  const y = d3.scaleLinear().domain([0, d3.max(binned, (b) => b.length) || 1]).nice().range([height - MARGIN.bottom, MARGIN.top]);
  const hover = binned[hoverIndex] ?? null;
  const yTicks = y.ticks(4).filter(Number.isInteger); // counts are whole numbers: no "0.2 URLs" tick
  const range = (b) => `${format(b.x0)} – ${format(b.x1)}`;

  return (
    <figure className="mlserve-figure">
      <div ref={ref} className="viz">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={label} onMouseLeave={() => setHoverIndex(null)}>
            <g className="viz-grid">
              {yTicks.map((t) => <line key={t} x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} />)}
            </g>
            <g className="viz-axis">
              {yTicks.map((t) => <text key={t} className="viz-tick" x={MARGIN.left - 6} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>)}
              {x.ticks(width < 420 ? 4 : 6).map((t) => (
                <text key={t} className="viz-tick" x={x(t)} y={height - MARGIN.bottom + 16} textAnchor="middle">{format(t)}</text>
              ))}
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(0)} y2={y(0)} />
              <text className="viz-axis-title" x={(MARGIN.left + width - MARGIN.right) / 2} y={height - 6} textAnchor="middle">{xLabel}</text>
              <text className="viz-axis-title" x={0} y={10}>{yLabel}</text>
            </g>
            {binned.map((b, i) => {
              const left = x(b.x0) + 1; // 1px each side = a 2px surface gap between touching bars
              const w = Math.max(0, x(b.x1) - x(b.x0) - 2);
              return (
                <g key={i} onMouseEnter={() => setHoverIndex(i)}>
                  <rect className="mlserve-hit" x={x(b.x0)} y={MARGIN.top} width={x(b.x1) - x(b.x0)} height={y(0) - MARGIN.top} />
                  {b.length > 0 && (
                    <path d={columnPath(left, w, y(0), y(b.length))}
                      className={hover && hoverIndex !== i ? 'mlserve-dimmed' : undefined} style={{ fill: color }} />
                  )}
                </g>
              );
            })}
            {marker != null && (
              <g className="mlserve-marker" transform={`translate(${x(marker)},0)`}>
                <line y1={MARGIN.top - 6} y2={y(0)} />
                <text y={MARGIN.top - 10} textAnchor={x(marker) > width - 90 ? 'end' : 'middle'}>{markerLabel}</text>
              </g>
            )}
          </svg>
        )}
        {hover && (
          <ChartTooltip x={x((hover.x0 + hover.x1) / 2)} y={y(hover.length)} width={width} title={range(hover)}>
            <TooltipRow color={color} label={yLabel} value={hover.length} />
          </ChartTooltip>
        )}
      </div>
      <details className="mlserve-details">
        <summary>Show data table</summary>
        <div className="table-wrap mlserve-table-scroll">
          <table className="table">
            <thead><tr><th scope="col">{xLabel || 'Bin'}</th><th scope="col" className="num">{yLabel}</th></tr></thead>
            <tbody>
              {binned.filter((b) => b.length).map((b) => (
                <tr key={b.x0}><td>{range(b)}</td><td className="num">{b.length}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
