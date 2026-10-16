/**
 * CalibrationDiagram – a reliability diagram plus a histogram of how many
 * predictions fall in each bin. Two SEPARATE charts that share one x scale
 * (so they line up) – never a second y-axis on the same plot.
 *
 * Pattern: D3 calculates, React renders
 * Hovering a bin highlights it in BOTH charts and shows one tooltip with
 * every model's numbers for that bin.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { MODELS } from './data/calibration.js';
import { columnPath, pct0 } from './helpers/chart.js';

const M = { top: 12, right: 16, bottom: 38, left: 52 };
const TOP_H = 300;
const BOTTOM_H = 130;
const BINS = MODELS[0].curve.map((b) => ({ x0: b.x0, x1: b.x1, bin: b.bin }));

export default function CalibrationDiagram() {
  const [ref, { width }] = useElementSize();
  const [hoverBin, setHoverBin] = useState(null);

  const x = d3.scaleLinear([0, 1], [M.left, width - M.right]); // shared by both charts
  const y = d3.scaleLinear([0, 1], [TOP_H - M.bottom, M.top]);
  const yCount = d3.scaleLinear([0, d3.max(MODELS, (m) => d3.max(m.curve, (b) => b.count))], [BOTTOM_H - 24, 8]).nice();
  const line = d3.line().defined((b) => b.count > 0).x((b) => x(b.predicted)).y((b) => y(b.observed));
  const band = x(0.1) - x(0);
  const barW = Math.min(24, (band - 8) / MODELS.length - 2); // 2px gap between the two bars

  function handleMove(event) {
    const [px] = d3.pointer(event.nativeEvent, event.currentTarget);
    const bin = Math.floor(x.invert(px) * 10);
    setHoverBin(bin >= 0 && bin < 10 ? bin : null);
  }

  const highlight = (height) => hoverBin !== null && (
    <rect x={x(BINS[hoverBin].x0)} y={0} width={band} height={height} style={{ fill: 'var(--color-text)', opacity: 0.05 }} />
  );

  return (
    <div className="stack-sm">
      <ul className="viz-legend">
        {MODELS.map((m) => (
          <li key={m.id}><span className="viz-key-line" style={{ background: m.color }} /> {m.name} · ECE {m.ece.toFixed(3)}</li>
        ))}
        <li><span className="viz-key-line" style={{ background: 'var(--color-text-subtle)', height: 1 }} /> perfectly calibrated</li>
      </ul>

      {/* A finger "leaves" the moment it lifts, so only a MOUSE leaving clears the tooltip –
          on a phone, a tap shows it and it stays until you tap another bin. */}
      <div className="viz" ref={ref} onPointerMove={handleMove} onClick={handleMove}
        onPointerLeave={(event) => event.pointerType !== 'touch' && setHoverBin(null)}>
        {width > 0 && (
          <>
            {/* role="group" (not "img") on both charts: they react to hover and taps */}
            <svg width={width} height={TOP_H} role="group"
              aria-label={`Reliability diagram. ${MODELS.map((m) => `${m.name}: expected calibration error ${m.ece.toFixed(3)}`).join('; ')}.`}>
              {highlight(TOP_H - M.bottom)}
              <g className="viz-grid">
                {y.ticks(5).map((t) => <line key={t} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />)}
              </g>
              <g className="viz-axis">
                {y.ticks(5).map((t) => <text key={t} x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{pct0(t)}</text>)}
                {x.ticks(5).map((t) => <text key={t} x={x(t)} y={TOP_H - M.bottom + 16} textAnchor="middle">{pct0(t)}</text>)}
              </g>
              <text className="viz-axis-title" x={(M.left + width - M.right) / 2} y={TOP_H - 4} textAnchor="middle">Mean predicted probability</text>
              <text className="viz-axis-title" transform={`translate(12,${(TOP_H - M.bottom + M.top) / 2}) rotate(-90)`} textAnchor="middle">Observed fraction phishing</text>
              <line className="d3ml-reference" x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} />
              {/* Direct labels on the two sides of the diagonal explain what "off the line" means */}
              <text className="viz-label-muted" x={x(0.02)} y={y(0.93)}>↖ {width < 520 ? 'more often' : 'above the line: happens more often'} than predicted</text>
              <text className="viz-label-muted" x={x(0.98)} y={y(0.04)} textAnchor="end">{width < 520 ? 'less often' : 'below: less often'} than predicted ↘</text>
              {MODELS.map((m) => (
                <g key={m.id}>
                  <path d={line(m.curve)} style={{ fill: 'none', stroke: m.color, strokeWidth: 2, strokeLinejoin: 'round' }} />
                  {m.curve.filter((b) => b.count > 0).map((b) => (
                    <circle key={b.bin} className="d3ml-dot" cx={x(b.predicted)} cy={y(b.observed)}
                      r={hoverBin === b.bin ? 6 : 4} style={{ fill: m.color }} />
                  ))}
                </g>
              ))}
            </svg>

            <svg width={width} height={BOTTOM_H} role="group" aria-label={`Number of predictions per bin: ${MODELS.map((m) => `${m.name} ${m.curve.map((b) => b.count).join(', ')}`).join('; ')}.`}>
              {highlight(BOTTOM_H - 24)}
              <g className="viz-grid">
                {yCount.ticks(3).map((t) => <line key={t} x1={M.left} x2={width - M.right} y1={yCount(t)} y2={yCount(t)} />)}
              </g>
              <g className="viz-axis">
                {yCount.ticks(3).map((t) => <text key={t} x={M.left - 8} y={yCount(t)} dy="0.32em" textAnchor="end">{t}</text>)}
              </g>
              <text className="viz-axis-title" x={M.left} y={BOTTOM_H - 4}>Predictions per bin (same x as above)</text>
              {MODELS.map((m, mi) => m.curve.map((b) => (
                <path key={`${m.id}-${b.bin}`} d={columnPath(x(b.x0) + 4 + mi * (barW + 2), barW, yCount(0), yCount(b.count))}
                  style={{ fill: m.color, opacity: hoverBin === null || hoverBin === b.bin ? 1 : 0.45 }} />
              )))}
              <line className="d3ml-baseline" x1={M.left} x2={width - M.right} y1={yCount(0)} y2={yCount(0)} />
            </svg>
          </>
        )}
        {hoverBin !== null && width > 0 && (
          <ChartTooltip x={x(BINS[hoverBin].x0 + 0.05)} y={TOP_H / 2} width={width}
            title={`Observed rate · bin ${pct0(BINS[hoverBin].x0)}–${pct0(BINS[hoverBin].x1)}`}>
            {MODELS.map((m) => {
              const b = m.curve[hoverBin];
              return (
                <TooltipRow key={m.id} keyType="line" color={m.color} label={m.short}
                  detail={`(said ${b.count ? pct0(b.predicted) : '–'}, n=${b.count})`} value={b.count ? pct0(b.observed) : '–'} />
              );
            })}
          </ChartTooltip>
        )}
      </div>

      <details className="d3ml-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th scope="col">Bin</th>{MODELS.map((m) => <th key={m.id} scope="col" className="num">{m.name}: said → observed (n)</th>)}</tr>
            </thead>
            <tbody>
              {BINS.map((bin) => (
                <tr key={bin.bin}>
                  <th scope="row">{pct0(bin.x0)}–{pct0(bin.x1)}</th>
                  {MODELS.map((m) => {
                    const b = m.curve[bin.bin];
                    return <td key={m.id} className="num">{b.count ? `${pct0(b.predicted)} → ${pct0(b.observed)} (${b.count})` : '–'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
