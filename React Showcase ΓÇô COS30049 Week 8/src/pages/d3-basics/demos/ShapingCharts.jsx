/**
 * ShapingCharts.jsx – the two mini charts used by DataShaping.jsx.
 * Pattern: D3 calculates, React renders.
 * Each chart measures its own width.
 *
 *   TotalsChart – horizontal bars of d3.rollup totals (≤ 5 bars, so each is labelled)
 *   Histogram   – the bins produced by d3.bin(), with a hover readout
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import { barPath, hBarPath } from './helpers/barPath.js';

export function TotalsChart({ data, title }) {
  const [ref, { width }] = useElementSize();
  const ROW = 38;
  const height = data.length * ROW;
  const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.total)]).range([0, Math.max(0, width - 56)]);
  return (
    <figure ref={ref} className="m-0">
      <figcaption className="small"><strong>{title}</strong></figcaption>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${title}: ${data.map((d) => `${d.name} ${d.total}`).join(', ')}`}>
          {data.map((d, i) => (
            <g key={d.name} transform={`translate(0,${i * ROW})`}>
              <text className="viz-tick" y={12}>{d.name}</text>
              <path className="d3-basics-bar" d={hBarPath(0, 17, x(d.total), 16)} />
              <text className="viz-label" x={x(d.total) + 6} y={25} dy="0.32em">{d3.format(',')(d.total)}</text>
            </g>
          ))}
        </svg>
      )}
    </figure>
  );
}

export function Histogram({ bins, title }) {
  const [ref, { width }] = useElementSize();
  const [active, setActive] = useState(null); // index of the hovered bin
  const H = 170;
  const M = { top: 10, right: 16, bottom: 24, left: 30 }; // right margin: room for the last tick label
  const x = d3.scaleLinear().domain([bins[0].x0, bins[bins.length - 1].x1]).range([M.left, width - M.right]);
  const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length)]).nice().range([H - M.bottom, M.top]);
  const bin = active === null ? null : bins[active];
  return (
    <figure ref={ref} className="m-0">
      <figcaption className="small"><strong>{title}</strong></figcaption>
      {width > 0 && (
        // role="group", not "img": the bars respond to the pointer (role="img" is for static pictures)
        <svg width={width} height={H} role="group" aria-label={`${title}: ${bins.length} bins`} onPointerLeave={() => setActive(null)}>
          {y.ticks(4).map((t) => (
            <g key={t}>
              <line className="d3-basics-gridline" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
              <text className="viz-tick" x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
            </g>
          ))}
          {bins.map((b, i) => (
            <g key={i} onPointerEnter={() => setActive(i)}>
              <rect className="d3-basics-hit" x={x(b.x0)} y={M.top} width={Math.max(0, x(b.x1) - x(b.x0))} height={H - M.top - M.bottom} />
              {/* 2px gap between neighbouring bars */}
              <path className="d3-basics-bar" style={{ opacity: active === null || active === i ? 1 : 0.45 }}
                d={barPath(x(b.x0) + 1, y(b.length), Math.max(0, x(b.x1) - x(b.x0) - 2), y(0) - y(b.length))} />
            </g>
          ))}
          <line className="d3-basics-baseline" x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
          {x.ticks(width < 360 ? 4 : 7).map((t) => (
            <text key={t} className="viz-tick" x={x(t)} y={H - 6} textAnchor="middle">{t}</text>
          ))}
        </svg>
      )}
      <p className="small muted m-0" aria-live="polite">
        {bin ? <><strong className="d3-basics-strong">{bin.length} rows</strong> with {bin.x0}–{bin.x1} students</> : 'Hover a bar to see its bin.'}
      </p>
    </figure>
  );
}
