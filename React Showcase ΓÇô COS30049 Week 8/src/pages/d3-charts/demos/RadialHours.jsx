/**
 * RadialHours – when do students study? 7 days × 24 hours around a clock face.
 * Pattern: D3 owns the <g>. d3.arc() turns (angle, inner radius, outer radius) into a path:
 *   • a scaleBand spreads the 24 hours around the circle (leaving a gap at the top for labels)
 *   • a second scaleBand spreads the visible days across the rings (Monday inside)
 * Switching All / Weekdays / Weekend only changes the ring scale. attrTween interpolates
 * each cell's radii – the radii drawn in the latest frame are stored on the DOM node – so rings
 * grow and shrink, and a click in the middle of a transition carries on from where they are.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { motion } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { studyHours, DAYS, DAY_NAMES } from './data/studyHours.js';

const VIEWS = [
  { id: 'all', label: 'All week', days: DAYS },
  { id: 'weekdays', label: 'Weekdays', days: DAYS.slice(0, 5) },
  { id: 'weekend', label: 'Weekend', days: DAYS.slice(5) },
];
const GAP = 0.5; // radians left open at 12 o'clock for the day labels
const HOUR_LABELS = { 0: 'midnight', 3: '3 am', 6: '6 am', 9: '9 am', 12: 'noon', 15: '3 pm', 18: '6 pm', 21: '9 pm' };
// 7 colour classes of ONE hue (--seq-1 … --seq-7); CSS variables, so the theme switch is free.
const color = d3.scaleQuantize([0, d3.max(studyHours, (d) => d.value)], d3.range(1, 8).map((i) => `var(--seq-${i})`));
const hourName = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'am' : 'pm'}`;

export default function RadialHours() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const [viewId, setViewId] = useState('all');
  const [tip, setTip] = useState(null);
  const size = Math.min(width, 520);
  const view = VIEWS.find((v) => v.id === viewId);
  const peak = d3.greatest(studyHours.filter((d) => view.days.includes(d.day)), (d) => d.value);
  const summary = `Radial heatmap of students online by hour and day. Busiest: ${DAY_NAMES[peak.dayIndex]} `
    + `at ${hourName(peak.hour)} with ${peak.value} students; quietest between 3 and 6 am.`;

  useEffect(() => {
    if (size === 0) return undefined;
    const g = d3.select(gRef.current);
    const compact = size < 400; // phones: thinner label margin and centre hole → thicker rings
    const outer = size / 2 - (compact ? 30 : 38); // room for the hour labels
    const inner = outer * (compact ? 0.3 : 0.38); // the hole in the middle holds the "Peak" label
    const angle = d3.scaleBand(d3.range(24), [GAP / 2, 2 * Math.PI - GAP / 2]);
    const ring = d3.scaleBand(view.days, [inner, outer]);
    const labelEvery = ring.bandwidth() < 13 ? 2 : 1; // rings too thin for 7 labels → Mo, We, Fr, Su
    const firstShown = DAYS.indexOf(view.days[0]);
    // Radii for one day: its ring, or – if hidden – a zero-width ring on the nearest edge.
    const radii = (d) => (ring(d.day) === undefined
      ? { r0: d.dayIndex < firstShown ? inner : outer, r1: d.dayIndex < firstShown ? inner : outer }
      : { r0: ring(d.day), r1: ring(d.day) + ring.bandwidth() });
    const arc = d3.arc().startAngle((d) => angle(d.hour)).endAngle((d) => angle(d.hour) + angle.bandwidth())
      .innerRadius((d) => d.r0).outerRadius((d) => d.r1);

    const hide = () => {
      g.selectAll('.is-active').classed('is-active', false);
      setTip(null);
    };
    const cells = g.select('.cells').selectAll('path').data(studyHours, (d) => `${d.day}-${d.hour}`)
      .join('path').attr('class', 'd3c-cell d3c-arc').style('fill', (d) => color(d.value))
      .on('pointerenter', function (event, d) {
        const [cx, cy] = arc.centroid({ ...d, ...this.radii });
        g.selectAll('.is-active').classed('is-active', false); // after a tap, the old cell is still marked
        d3.select(this).classed('is-active', true).raise();
        setTip({
          x: size / 2 + cx,
          y: size / 2 + cy,
          title: `${DAY_NAMES[d.dayIndex]}, ${hourName(d.hour)} – ${hourName((d.hour + 1) % 24)}`,
          rows: [{ key: 'swatch', color: color(d.value), label: 'Students online', value: d.value }],
        });
      })
      .on('pointerleave', (event) => {
        if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
      });
    const stopDismiss = onPointerDownOutside(g.node(), hide); // …until the next tap outside the chart

    cells.transition().duration(motion(800)).ease(d3.easeCubicInOut)
      .style('opacity', (d) => (view.days.includes(d.day) ? 1 : 0))
      .attrTween('d', function (d) {
        // Start from the radii on screen (first time: grow out from the centre)…
        const interpolate = d3.interpolate(this.radii ?? { r0: inner, r1: inner }, radii(d));
        return (t) => {
          this.radii = interpolate(t); // …and store them EVERY frame, so an interrupted
          return arc({ ...d, ...this.radii }); // transition continues from here instead of jumping
        };
      });

    // Day labels in the gap at 12 o'clock, hour labels around the outside.
    const dayLabels = g.select('.days').selectAll('text').data(DAYS).join('text')
      .attr('class', 'viz-label-muted').attr('text-anchor', 'middle').attr('dy', '0.35em').text((d) => d.slice(0, 2));
    dayLabels.transition().duration(motion(800))
      .attr('y', (d) => {
        const { r0, r1 } = radii({ day: d, dayIndex: DAYS.indexOf(d) });
        return -(r0 + r1) / 2; // middle of the ring, straight up
      })
      .style('opacity', (d) => (view.days.includes(d) && view.days.indexOf(d) % labelEvery === 0 ? 1 : 0));
    const labelR = outer + (compact ? 14 : 18);
    g.select('.hours').selectAll('text').data(Object.entries(HOUR_LABELS)).join('text')
      .attr('class', 'viz-label-muted').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('x', ([h]) => Math.sin(angle(+h) + angle.bandwidth() / 2) * labelR)
      .attr('y', ([h]) => -Math.cos(angle(+h) + angle.bandwidth() / 2) * labelR)
      .text(([, label]) => label);

    return () => {
      stopDismiss();
      cells.interrupt().on('pointerenter pointerleave', null);
      dayLabels.interrupt();
    };
  }, [size, view]);

  return (
    <div>
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Days to show">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className={`btn btn-sm ${viewId === v.id ? 'active' : ''}`} aria-pressed={viewId === v.id} onClick={() => setViewId(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="viz-legend" aria-label="Students online">
        {color.range().map((c, i) => (
          <li key={c}>
            <span className="viz-swatch" style={{ background: c }} aria-hidden="true" />
            {i === 0 ? `< ${Math.round(color.thresholds()[0])}` : i === 6 ? `${Math.round(color.thresholds()[5])}+` : ''}
          </li>
        ))}
        <li>students online</li>
      </ul>
      {/* The outer div measures the available width; the inner .viz is exactly as wide as the chart. */}
      <div className="d3c-center" ref={wrapRef}>
        <div className="viz" style={{ width: size }}>
          <svg width={size} height={size} role="group" aria-label={summary}>
            <g ref={gRef} transform={`translate(${size / 2},${size / 2})`}>
              <g className="cells" />
              <g className="days" />
              <g className="hours" />
            </g>
            {/* The centre is plain React: it only shows text derived from state. */}
            <text className="d3c-radial-caption" x={size / 2} y={size / 2 - 18}>Peak</text>
            <text className="d3c-radial-peak" x={size / 2} y={size / 2 + 4}>{peak.day} {hourName(peak.hour)}</text>
            <text className="d3c-radial-caption" x={size / 2} y={size / 2 + 22}>{peak.value} online</text>
          </svg>
          <ChartTooltip tip={tip} />
        </div>
      </div>
      <DataTable
        columns={['Hour', ...DAYS]}
        rows={d3.range(24).map((h) => [hourName(h), ...DAYS.map((d, i) => studyHours[i * 24 + h].value)])}
      />
    </div>
  );
}
