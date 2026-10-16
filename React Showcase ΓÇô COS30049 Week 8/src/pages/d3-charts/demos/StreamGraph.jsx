/**
 * StreamGraph – one d3.stack(), three layouts: stacked area, 100% and streamgraph.
 * Pattern: D3 owns the <g>. The Layout / Order buttons only change the NUMBERS that
 * d3.stack() returns. The <path>s are keyed by activity and their "d" attribute is
 * transitioned, so the layers morph from one layout into the next. A hidden activity is
 * stacked as zeros, so it shrinks away smoothly instead of popping out – and once it is flat,
 * it also drops its 2px outline (a zero-height path with a stroke still draws a thin line).
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { motion } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { ACTIVITIES, activityWeeks } from './data/activities.js';

const LAYOUTS = [
  { id: 'stack', label: 'Stacked', chart: 'Stacked area chart', offset: d3.stackOffsetNone, axis: 'Hours per week' },
  { id: 'expand', label: '100%', chart: '100% stacked area chart', offset: d3.stackOffsetExpand, axis: 'Share of study time' },
  { id: 'wiggle', label: 'Streamgraph', chart: 'Streamgraph', offset: d3.stackOffsetWiggle, axis: 'Streamgraph – thickness = hours' },
];
const ORDERS = [
  { id: 'none', label: 'As listed', order: d3.stackOrderNone },
  { id: 'insideOut', label: 'Inside-out', order: d3.stackOrderInsideOut },
  { id: 'ascending', label: 'Smallest first', order: d3.stackOrderAscending },
];
const M = { top: 30, right: 12, bottom: 40, left: 44 };
const H = 330;
const innerH = H - M.top - M.bottom;

export default function StreamGraph() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const [layoutId, setLayoutId] = useState('stack');
  const [orderId, setOrderId] = useState('none');
  const [hidden, setHidden] = useState(() => new Set());
  const [tip, setTip] = useState(null);
  const labelId = useId();
  const layout = LAYOUTS.find((l) => l.id === layoutId);
  const innerW = Math.max(0, width - M.left - M.right);
  const summary = `${layout.chart} of weekly study hours by activity over a semester. Assignment work peaks `
    + 'in weeks 6 and 11; exam revision dominates the study vacation and exam weeks.';

  function toggle(key) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < ACTIVITIES.length - 1) next.add(key); // keep at least one layer
      return next;
    });
  }

  useEffect(() => {
    if (innerW === 0) return undefined;
    const g = d3.select(gRef.current);
    const { offset } = LAYOUTS.find((l) => l.id === layoutId);
    const { order } = ORDERS.find((o) => o.id === orderId);

    // d3.stack() turns rows into one array per activity: series[k][week] = [y0, y1]
    const series = d3
      .stack()
      .keys(ACTIVITIES.map((a) => a.key))
      .value((row, key) => (hidden.has(key) ? 0 : row[key]))
      .order(order)
      .offset(offset)(activityWeeks);

    const x = d3.scalePoint(activityWeeks.map((d) => d.week), [0, innerW]);
    const y = d3.scaleLinear([d3.min(series, (s) => d3.min(s, (d) => d[0])), d3.max(series, (s) => d3.max(s, (d) => d[1]))], [innerH, 0]);
    if (layoutId === 'stack') y.nice();
    const area = d3.area().x((d) => x(d.data.week)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveMonotoneX);
    const flat = d3.area().x((d) => x(d.data.week)).y(innerH).curve(d3.curveMonotoneX); // entrance start
    const t = g.transition().duration(motion(900)).ease(d3.easeCubicInOut);

    const yAxis = d3.axisLeft(y).ticks(5);
    if (layoutId === 'expand') yAxis.tickFormat(d3.format('.0%'));
    if (layoutId === 'wiggle') yAxis.tickValues([]); // a streamgraph has no meaningful baseline
    g.select('.y-axis').transition(t).call(yAxis);
    // Phones: ~18px per week is too tight for "12 SV E1 E2", so every other label is left out.
    // Every week keeps its tick, and the kept labels include 7 (break), SV and E2 – so the
    // unlabelled tick between SV and E2 can only be E1.
    const thin = x.step() < 26;
    g.select('.x-axis').call(d3.axisBottom(x).tickSizeOuter(0).tickFormat((w, i) => (thin && i % 2 ? '' : w)));

    const layers = g
      .select('.layers')
      .selectAll('path')
      .data(series, (s) => s.key)
      .join((enter) => enter.append('path').attr('class', 'd3c-layer').attr('d', flat)
        .style('--series', (s) => ACTIVITIES.find((a) => a.key === s.key).color));
    // The morph: D3 interpolates the numbers in "d". A layer coming back gets its outline at once;
    // a hidden one loses it only when the shrink has finished ('end' fires once per element).
    layers.filter((s) => !hidden.has(s.key)).classed('is-off', false);
    layers.transition(t).attr('d', area)
      .on('end', function (s) { d3.select(this).classed('is-off', hidden.has(s.key)); });

    // Crosshair + tooltip; the layer under the pointer is emphasised.
    const hover = g.select('.hover').attr('display', 'none');
    const hide = () => {
      layers.classed('is-faded', false);
      hover.attr('display', 'none');
      setTip(null);
    };
    g.select('.overlay')
      .on('pointermove pointerdown', (event) => {
        const [px, py] = d3.pointer(event);
        const i = d3.minIndex(activityWeeks, (d) => Math.abs(x(d.week) - px));
        const week = activityWeeks[i];
        const under = series.find((s) => y(s[i][1]) <= py && py <= y(s[i][0]) && s[i][1] > s[i][0]);
        layers.classed('is-faded', (s) => Boolean(under) && s.key !== under.key);
        hover.attr('display', null).attr('transform', `translate(${x(week.week)},0)`);
        const shown = ACTIVITIES.filter((a) => !hidden.has(a.key));
        const total = d3.sum(shown, (a) => week[a.key]);
        setTip({
          x: M.left + x(week.week),
          y: M.top + py,
          title: `Week ${week.week} · ${total.toFixed(1)} h in total`,
          rows: shown.map((a) => ({
            key: 'swatch',
            color: a.color,
            label: a.label,
            active: under?.key === a.key,
            value: layoutId === 'expand' ? d3.format('.0%')(total ? week[a.key] / total : 0) : `${week[a.key]} h`,
          })),
        });
      })
      .on('pointerleave', (event) => {
        if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
      });
    const stopDismiss = onPointerDownOutside(g.node(), hide); // …until the next tap outside the chart

    return () => {
      stopDismiss();
      g.select('.overlay').on('pointermove pointerdown pointerleave', null);
      g.selectAll('*').interrupt();
    };
  }, [layoutId, orderId, hidden, innerW]);

  return (
    <div>
      <div className="viz-controls">
        <span className="d3c-control-label" id={`${labelId}-layout`}>Layout</span>
        <div className="btn-group" role="group" aria-labelledby={`${labelId}-layout`}>
          {LAYOUTS.map((l) => (
            <button key={l.id} type="button" className={`btn btn-sm ${layoutId === l.id ? 'active' : ''}`} aria-pressed={layoutId === l.id} onClick={() => setLayoutId(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <span className="d3c-control-label" id={`${labelId}-order`}>Order</span>
        <div className="btn-group" role="group" aria-labelledby={`${labelId}-order`}>
          {ORDERS.map((o) => (
            <button key={o.id} type="button" className={`btn btn-sm ${orderId === o.id ? 'active' : ''}`} aria-pressed={orderId === o.id} onClick={() => setOrderId(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="viz-legend" aria-label="Activities – click to show or hide">
        {ACTIVITIES.map((a) => (
          <li key={a.key}>
            <button type="button" aria-pressed={!hidden.has(a.key)} onClick={() => toggle(a.key)}>
              <span className="viz-swatch" style={{ background: a.color }} aria-hidden="true" />
              {a.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="viz" ref={wrapRef}>
        <svg width={width} height={H} role="group" aria-label={summary}>
          <g ref={gRef} transform={`translate(${M.left},${M.top})`}>
            <g className="layers" />
            <g className="viz-axis x-axis" transform={`translate(0,${innerH})`} />
            <g className="viz-axis y-axis" />
            <text className="viz-axis-title" x={-M.left} y={-14}>{layout.axis}</text>
            <text className="viz-axis-title" x={innerW / 2} y={innerH + 34} textAnchor="middle">
              Week (SV = study vacation, E = exams)
            </text>
            <g className="hover" pointerEvents="none">
              <line className="d3c-crosshair" y2={innerH} />
            </g>
            <rect className="overlay d3c-overlay d3c-scrub" width={innerW} height={innerH} />
          </g>
        </svg>
        <ChartTooltip tip={tip} />
      </div>
      <DataTable
        columns={['Week', ...ACTIVITIES.map((a) => `${a.label} (h)`)]}
        rows={activityWeeks.map((w) => [w.week, ...ACTIVITIES.map((a) => w[a.key])])}
      />
    </div>
  );
}
