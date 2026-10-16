/**
 * ProbabilityGauge – a half-circle meter for P(suspicious) with a threshold tick.
 * Pattern: D3 owns the <g>
 *
 * React renders the <svg> and the centre text; D3 owns the arc and the threshold
 * marker inside gRef, so it can ANIMATE them with transitions: the arc sweeps
 * from the previous probability to the new one instead of jumping.
 */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../../hooks/useElementSize.js';
import { motion, pct, probability as formatP } from './chartUtils.js';

const START = -Math.PI / 2; // left end of the half circle (0 %)
const END = Math.PI / 2; // right end (100 %)

export default function ProbabilityGauge({ probability, threshold }) {
  const [ref, { width }] = useElementSize();
  const gRef = useRef(null);
  const previous = useRef(0); // where the arc was last time – the transition starts there

  const size = Math.min(width, 300);
  const radius = size / 2 - 14;
  const thickness = Math.max(14, radius * 0.2);
  const hasValue = probability != null;
  const isSuspicious = hasValue && probability >= threshold;

  useEffect(() => {
    if (size <= 0) return undefined; // hidden (Code tab) or not measured yet
    const g = d3.select(gRef.current);
    // A scale maps a probability (domain 0…1) to an angle (range −90°…+90°).
    const angle = d3.scaleLinear().domain([0, 1]).range([START, END]).clamp(true);
    const arc = d3.arc().innerRadius(radius - thickness).outerRadius(radius).cornerRadius(3);

    // .join() creates each element on the first run and REUSES it afterwards,
    // so this effect can run again (new data, StrictMode) without duplicates.
    g.selectAll('path.mlserve-gauge-track')
      .data([null])
      .join('path')
      .attr('class', 'mlserve-gauge-track')
      .attr('d', arc({ startAngle: START, endAngle: END }));

    const target = hasValue ? probability : 0;
    g.selectAll('path.mlserve-gauge-value')
      .data([target])
      .join('path')
      .attr('class', `mlserve-gauge-value ${isSuspicious ? 'is-suspicious' : 'is-safe'}`)
      .transition()
      .duration(motion(700))
      .ease(d3.easeCubicOut)
      // attrTween: compute the path for every frame between the old and the new value.
      .attrTween('d', () => {
        const between = d3.interpolateNumber(previous.current, target);
        return (t) => {
          previous.current = between(t); // if a newer value interrupts us, it starts from here
          return arc({ startAngle: START, endAngle: angle(previous.current) });
        };
      });

    // The threshold marker is a tick drawn pointing straight up, then rotated into place.
    const marker = g.selectAll('g.mlserve-gauge-threshold')
      .data([threshold])
      .join((enter) => {
        const m = enter.append('g').attr('class', 'mlserve-gauge-threshold');
        m.append('line');
        return m;
      });
    marker.select('line').attr('y1', -(radius + 6)).attr('y2', -(radius - thickness - 6));
    marker.transition().duration(motion(300)).attr('transform', `rotate(${(threshold - 0.5) * 180})`);

    return () => g.selectAll('*').interrupt(); // stop running transitions on re-run / unmount
  }, [size, radius, thickness, probability, threshold, hasValue, isSuspicious]);

  return (
    <div ref={ref} className="viz mlserve-gauge">
      {size > 0 && (
        <svg width={size} height={radius + 40} role="img"
          aria-label={hasValue ? `Probability suspicious ${formatP(probability)}, threshold ${pct(threshold)}` : 'No prediction yet'}>
          <g ref={gRef} transform={`translate(${size / 2},${radius + 10})`} />
          {/* React-owned text: siblings of the D3 group, never inside it. */}
          <g transform={`translate(${size / 2},${radius + 10})`}>
            <text className="mlserve-gauge-value-text" y={-10} textAnchor="middle">
              {formatP(probability)}
            </text>
            <text className="viz-label-muted" y={12} textAnchor="middle">P(suspicious)</text>
            <text className="viz-label-muted" x={-(radius - thickness / 2)} y={24} textAnchor="middle">0%</text>
            <text className="viz-label-muted" x={radius - thickness / 2} y={24} textAnchor="middle">100%</text>
          </g>
        </svg>
      )}
    </div>
  );
}
