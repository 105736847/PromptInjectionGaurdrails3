/**
 * RocCurve – true-positive rate against false-positive rate, from GET /api/ml/metrics.
 * Pattern: D3 calculates, React renders
 *
 * d3.line / d3.area build the path strings; React renders them. The dot is the
 * "operating point" for the current threshold, taken from the back end's
 * thresholds table. Hover anywhere to read the curve (nearest point by x).
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './ChartTooltip.jsx';
import { pct, pct0 } from './chartUtils.js';

const MARGIN = { top: 12, right: 16, bottom: 42, left: 46 };

export default function RocCurve({ points, auc, operating }) {
  const [ref, { width }] = useElementSize();
  const [hover, setHover] = useState(null);
  const height = Math.max(240, Math.min(340, width * 0.78));

  const x = d3.scaleLinear().domain([0, 1]).range([MARGIN.left, width - MARGIN.right]);
  const y = d3.scaleLinear().domain([0, 1]).range([height - MARGIN.bottom, MARGIN.top]);
  // line() and area() turn the points into SVG path strings ("M46,300L52,120…").
  const line = d3.line().x((d) => x(d.x)).y((d) => y(d.y));
  const area = d3.area().x((d) => x(d.x)).y0(y(0)).y1((d) => y(d.y));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  // Keep the operating-point label inside the chart: flip it to the left near the right edge
  // (low thresholds sit at the top right) and above the dot near the bottom.
  const flipLeft = x(operating.fpr) > width - MARGIN.right - 100;
  const flipUp = y(operating.tpr) > height - MARGIN.bottom - 24;

  function handleMove(event) {
    const [mx] = d3.pointer(event);
    const fpr = x.invert(mx);
    // bisector finds where fpr would be inserted into the sorted x values → the nearest point.
    const i = Math.min(points.length - 1, d3.bisector((d) => d.x).center(points, fpr));
    setHover(points[i]);
  }

  return (
    <figure className="mlserve-figure">
      <figcaption className="mlserve-figure-title">ROC curve · AUC = {auc.toFixed(3)}</figcaption>
      <div ref={ref} className="viz">
        {width > 0 && (
          <svg width={width} height={height} role="img"
            aria-label={`ROC curve with area under the curve ${auc.toFixed(3)}. At threshold ${operating.threshold}: true-positive rate ${pct(operating.tpr)}, false-positive rate ${pct(operating.fpr)}.`}
            onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
            <g className="viz-grid">
              {ticks.map((t) => <line key={`x${t}`} x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} />)}
              {ticks.map((t) => <line key={`y${t}`} x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} />)}
            </g>
            <g className="viz-axis">
              {ticks.map((t) => <text key={`xt${t}`} className="viz-tick" x={x(t)} y={y(0) + 16} textAnchor="middle">{pct0(t)}</text>)}
              {ticks.map((t) => <text key={`yt${t}`} className="viz-tick" x={x(0) - 6} y={y(t)} dy="0.32em" textAnchor="end">{pct0(t)}</text>)}
              <text className="viz-axis-title" x={(x(0) + x(1)) / 2} y={height - 6} textAnchor="middle">False-positive rate (safe URLs flagged)</text>
              <text className="viz-axis-title" transform={`translate(12,${(y(0) + y(1)) / 2}) rotate(-90)`} textAnchor="middle">True-positive rate (recall)</text>
            </g>
            {/* A model that guesses at random lies on this diagonal (AUC 0.5). */}
            <line className="mlserve-reference" x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} />
            <text className="viz-label-muted" x={x(0.62)} y={y(0.56)} transform={`rotate(${-Math.atan2(y(0) - y(1), x(1) - x(0)) * 180 / Math.PI},${x(0.62)},${y(0.56)})`}>random guess</text>
            <path d={area(points)} className="mlserve-area" />
            <path d={line(points)} className="mlserve-line" />
            {hover && <circle className="mlserve-hover-dot" cx={x(hover.x)} cy={y(hover.y)} r={4} />}
            <g transform={`translate(${x(operating.fpr)},${y(operating.tpr)})`}>
              <circle className="mlserve-operating" r={6} />
              <text className="viz-label mlserve-halo" x={flipLeft ? -10 : 10} y={flipUp ? -10 : 16}
                textAnchor={flipLeft ? 'end' : 'start'}>
                threshold {operating.threshold.toFixed(2)}
              </text>
            </g>
          </svg>
        )}
        {hover && (
          <ChartTooltip x={x(hover.x)} y={y(hover.y)} width={width} title="On the curve">
            <TooltipRow color="var(--chart-1)" label="True-positive rate" value={pct(hover.y)} />
            <TooltipRow label="False-positive rate" value={pct(hover.x)} />
          </ChartTooltip>
        )}
      </div>
    </figure>
  );
}
