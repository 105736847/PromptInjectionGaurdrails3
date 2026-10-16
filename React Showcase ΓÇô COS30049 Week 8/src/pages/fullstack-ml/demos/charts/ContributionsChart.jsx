/**
 * ContributionsChart – a diverging bar chart of each feature's push on the prediction.
 * Pattern: D3 calculates, React renders
 *
 * d3.scaleBand / d3.scaleLinear turn features and numbers into pixels; React
 * draws every <path> and <text>. Bars to the right push towards "suspicious",
 * bars to the left towards "safe". Sorted by size, so the biggest reasons come first.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './ChartTooltip.jsx';
import { horizontalBarPath, signed } from './chartUtils.js';

const ROW = 30; // px per feature: the whole row is the hover target (≥ 24 px)
const MARGIN = { top: 8, right: 44, bottom: 40 };
const colorOf = (c) => (c >= 0 ? 'var(--div-pos)' : 'var(--div-neg)');

export default function ContributionsChart({ contributions, active, onActiveChange }) {
  const [ref, { width }] = useElementSize();
  const [tip, setTip] = useState(null); // { item, x, y } while hovering or focusing a bar

  const rows = [...contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const narrow = width < 440;
  const labelWidth = narrow ? 112 : 150;
  const ticks = narrow ? 3 : 5;
  const height = MARGIN.top + rows.length * ROW + MARGIN.bottom;
  const extent = d3.max(rows, (d) => Math.abs(d.contribution)) || 1;
  const biggest = extent * 0.25; // only the larger bars get a number (the table has all of them)

  // Symmetric domain → zero sits in the middle, so left/right lengths are comparable.
  const x = d3.scaleLinear().domain([-extent, extent]).nice().range([labelWidth + (narrow ? 34 : 40), width - MARGIN.right]);
  const y = d3.scaleBand().domain(rows.map((d) => d.feature)).range([MARGIN.top, height - MARGIN.bottom]).padding(0.3);
  const barHeight = Math.min(y.bandwidth(), 20);

  function show(item) {
    onActiveChange?.(item.feature);
    setTip({ item, x: x(item.contribution), y: y(item.feature) + y.bandwidth() / 2 });
  }
  function hide() {
    onActiveChange?.(null);
    setTip(null);
  }

  return (
    <div className="mlserve-figure">
      <ul className="viz-legend" aria-label="Legend">
        <li><span className="viz-swatch" style={{ background: 'var(--div-neg)' }} /> pushes towards safe</li>
        <li><span className="viz-swatch" style={{ background: 'var(--div-pos)' }} /> pushes towards suspicious</li>
      </ul>
      {/* .viz is position: relative – the tooltip's x/y are measured from the top of the SVG */}
      <div ref={ref} className="viz">
        {/* role="group", not "img": an img hides its children from screen readers, but every bar is
            focusable – so each bar is its own named img inside the group. */}
        {width > 0 && (
          <svg width={width} height={height} role="group" aria-label="Contribution of each feature to this prediction">
            <g className="viz-grid">
              {x.ticks(ticks).map((t) => (
                <line key={t} x1={x(t)} x2={x(t)} y1={MARGIN.top} y2={height - MARGIN.bottom} />
              ))}
            </g>
            {rows.map((d) => {
              const top = y(d.feature);
              const dimmed = active && active !== d.feature;
              const clippedNote = d.clipped_to != null ? ` (clipped to ${d.clipped_to})` : '';
              return (
                <g key={d.feature} className={`mlserve-bar-row${dimmed ? ' is-dimmed' : ''}`} tabIndex={0} role="img"
                  aria-label={`${d.label}: value ${d.value}${clippedNote}, contribution ${signed(d.contribution)}`}
                  onMouseEnter={() => show(d)} onMouseLeave={hide} onFocus={() => show(d)} onBlur={hide}>
                  <rect className="mlserve-hit" x={0} y={top - (y.step() - y.bandwidth()) / 2} width={width} height={y.step()} />
                  <text className="viz-label" x={labelWidth} y={top + y.bandwidth() / 2} dy="0.35em" textAnchor="end">{d.label}</text>
                  <path d={horizontalBarPath(top + (y.bandwidth() - barHeight) / 2, barHeight, x(0), x(d.contribution))}
                    style={{ fill: colorOf(d.contribution) }} />
                  {Math.abs(d.contribution) >= biggest && (
                    <text className="viz-label-muted" y={top + y.bandwidth() / 2} dy="0.35em"
                      x={x(d.contribution) + (d.contribution >= 0 ? 6 : -6)} textAnchor={d.contribution >= 0 ? 'start' : 'end'}>
                      {signed(d.contribution)}
                    </text>
                  )}
                </g>
              );
            })}
            <line className="mlserve-zero" x1={x(0)} x2={x(0)} y1={MARGIN.top - 4} y2={height - MARGIN.bottom} />
            <g className="viz-axis" transform={`translate(0,${height - MARGIN.bottom})`}>
              {x.ticks(ticks).map((t) => (
                <text key={t} className="viz-tick" x={x(t)} y={16} textAnchor="middle">{t === 0 ? '0' : d3.format('+')(t)}</text>
              ))}
              <text className="viz-axis-title" x={x(0)} y={34} textAnchor="middle">contribution to the log-odds</text>
            </g>
          </svg>
        )}
        {tip && (
          <ChartTooltip x={tip.x} y={tip.y} width={width} title={tip.item.label}>
            <TooltipRow color={colorOf(tip.item.contribution)} label="Contribution" value={signed(tip.item.contribution)} />
            <TooltipRow label="Raw value" value={d3.format(',.4~f')(tip.item.value)} />
            {tip.item.clipped_to != null && (
              <TooltipRow label="Clipped to (training range)" value={d3.format(',.4~f')(tip.item.clipped_to)} />
            )}
            <TooltipRow label="Scaled (z)" value={signed(tip.item.scaled)} />
            <TooltipRow label="Weight" value={signed(tip.item.weight)} />
          </ChartTooltip>
        )}
      </div>
    </div>
  );
}
