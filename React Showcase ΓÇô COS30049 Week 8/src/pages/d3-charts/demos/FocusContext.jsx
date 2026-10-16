/**
 * FocusContext – two years of daily active learners, with "focus + context".
 * Pattern: D3 owns the <g>. React renders an empty SVG skeleton; ONE effect builds the
 * scales, axes and two interaction behaviours and keeps them in sync:
 *   • d3.zoom on the big "focus" chart (x only): drag to pan, Ctrl/⌘ + scroll to zoom (or pinch)
 *   • d3.brushX on the small "context" chart: drag or resize the window to pick the range
 * Zooming moves the brush and brushing sets the zoom – a `syncing` flag stops the ping-pong.
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { motion, pageFriendlyZoom, svgId } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { learners, examPeriods, monthly, parseDay } from './data/learners.js';

const M = { top: 30, right: 12, bottom: 24, left: 46 };
const FOCUS_H = 250; // plot height of the big chart
const CONTEXT_H = 48; // plot height of the overview
const GAP = 52; // room for the focus x-axis + the overview title
const HEIGHT = M.top + FOCUS_H + GAP + CONTEXT_H + M.bottom;
const PRESETS = [
  { label: 'Semester 1, 2025', range: ['2025-02-17', '2025-07-07'] },
  { label: 'Last 8 weeks', range: ['2025-11-05', '2025-12-31'] },
];
const fmtDay = d3.utcFormat('%a %-d %b %Y');
const fmtShort = d3.utcFormat('%-d %b %Y');
const fmtMonth = d3.utcFormat('%b %Y');
const bisectDate = d3.bisector((d) => d.date).center;
const SUMMARY = 'Area chart of daily active learners from January 2024 to December 2025. Activity rises in every '
  + 'semester, peaks at the start of each exam period and drops over the summer holidays.';

// Exam periods as shaded, labelled bands. It is a join, so calling it again only updates.
function drawBands(parent, x, height, withLabels) {
  const bands = parent
    .select('.bands')
    .selectAll('g')
    .data(examPeriods)
    .join((enter) => {
      const g = enter.append('g').attr('class', 'd3c-band');
      g.append('rect');
      g.append('text').attr('y', 14);
      return g;
    });
  bands.select('rect')
    .attr('x', (d) => x(d.start))
    .attr('width', (d) => Math.max(0, x(d.end) - x(d.start)))
    .attr('height', height);
  bands.select('text').attr('x', (d) => (x(d.start) + x(d.end)) / 2).text(withLabels ? 'Exams' : '');
}

export default function FocusContext() {
  const [wrapRef, { width }] = useElementSize();
  const svgRef = useRef(null);
  const actions = useRef(null); // { reset, show } – created by the effect, called by the buttons
  const visible = useRef(null); // last visible date range, so a resize keeps the zoom
  const [range, setRange] = useState(null);
  const [tip, setTip] = useState(null);
  const clipId = svgId(useId(), 'focus-clip');
  const innerW = Math.max(0, width - M.left - M.right);

  useEffect(() => {
    if (innerW === 0) return undefined; // hidden (Code tab) or not measured yet
    const svg = d3.select(svgRef.current);
    const focus = svg.select('.focus');
    const context = svg.select('.context');
    const ticks = innerW < 500 ? 4 : 8;

    // Scales: x2 always shows everything, x is the zoomed copy used by the focus chart.
    const x2 = d3.scaleUtc(d3.extent(learners, (d) => d.date), [0, innerW]);
    const y = d3.scaleLinear([0, d3.max(learners, (d) => d.value)], [FOCUS_H, 0]).nice();
    const y2 = y.copy().range([CONTEXT_H, 0]);
    let x = x2.copy();
    const area = (xs, ys) => d3.area().x((d) => xs(d.date)).y0(ys(0)).y1((d) => ys(d.value));
    const line = (xs, ys) => d3.line().x((d) => xs(d.date)).y((d) => ys(d.value));

    // Parts that never move: y-axis, gridlines and the whole overview chart.
    focus.select('.y-axis').call(d3.axisLeft(y).ticks(5, '~s'));
    focus.select('.grid').call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''));
    context.select('.area').datum(learners).attr('d', area(x2, y2));
    context.select('.line').datum(learners).attr('d', line(x2, y2));
    context.select('.x-axis').call(d3.axisBottom(x2).ticks(ticks).tickSizeOuter(0));
    drawBands(context, x2, CONTEXT_H, false);

    // Parts that follow the zoom.
    function drawFocus() {
      focus.select('.x-axis').call(d3.axisBottom(x).ticks(ticks).tickSizeOuter(0));
      focus.select('.area').datum(learners).attr('d', area(x, y));
      focus.select('.line').datum(learners).attr('d', line(x, y));
      drawBands(focus, x, FOCUS_H, true);
    }

    const zoomRect = focus.select('.zoom');
    const brushG = context.select('.brush');
    const hover = focus.select('.hover').attr('display', 'none');
    let syncing = false; // true while one behaviour is updating the other
    let pointerX = null; // the pointer's x in the chart (px) – null while it is outside

    // Crosshair: find the nearest day with a bisector, then move the line + dot there.
    function showDay() {
      const d = learners[bisectDate(learners, x.invert(pointerX))];
      const exam = examPeriods.find((p) => d.date >= p.start && d.date < p.end);
      hover.attr('display', null).attr('transform', `translate(${x(d.date)},0)`);
      hover.select('circle').attr('cy', y(d.value));
      setTip({
        x: M.left + x(d.date),
        y: M.top + y(d.value),
        title: exam ? `${fmtDay(d.date)} · ${exam.label}` : fmtDay(d.date),
        rows: [{ key: 'line', color: 'var(--chart-1)', label: 'Active learners', value: d3.format(',')(d.value) }],
      });
    }

    // The "Showing …" text is an aria-live region: a screen reader reads every change aloud.
    // So React only hears about the range when a gesture ENDS – not 60 times a second while dragging.
    const announce = () => setRange(x.domain());

    const zoom = pageFriendlyZoom()
      .scaleExtent([1, 36]) // from 2 years down to about 3 weeks
      .extent([[0, 0], [innerW, FOCUS_H]])
      .translateExtent([[0, 0], [innerW, FOCUS_H]]) // you can't pan past the data
      .on('zoom', (event) => {
        x = event.transform.rescaleX(x2); // the zoom transform re-scales the x-axis only
        drawFocus();
        if (pointerX !== null) showDay(); // zooming changes the day under a still pointer
        visible.current = x.domain();
        if (syncing) return;
        syncing = true;
        brushG.call(brush.move, x.range().map(event.transform.invertX, event.transform));
        syncing = false;
      })
      .on('end', () => {
        if (!syncing) announce(); // while the brush drives the zoom, the brush announces instead
      });

    const brush = d3
      .brushX()
      .extent([[0, 0], [innerW, CONTEXT_H]])
      .on('brush end', (event) => {
        if (syncing) return;
        if (!event.selection) return actions.current?.reset(); // clicked outside the window → show all
        const [x0, x1] = event.selection;
        syncing = true;
        zoomRect.call(zoom.transform, d3.zoomIdentity.scale(innerW / (x1 - x0)).translate(-x0, 0));
        syncing = false;
        if (event.type === 'end') announce();
      });

    const hide = () => {
      pointerX = null;
      hover.attr('display', 'none');
      setTip(null);
    };
    zoomRect
      .call(zoom)
      .on('pointermove.tip pointerdown.tip', (event) => {
        pointerX = d3.pointer(event)[0];
        showDay();
      })
      .on('pointerleave.tip', (event) => {
        if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
      });
    const stopDismiss = onPointerDownOutside(svg.node(), hide); // …until the next tap outside the chart

    actions.current = {
      reset: () => zoomRect.transition().duration(motion(750)).call(zoom.transform, d3.zoomIdentity),
      show: (dates) => brushG.transition().duration(motion(750)).call(brush.move, dates.map(x2)),
    };
    // Start zoomed in (or where the reader was before a resize) – brush.move also sets the zoom.
    brushG.call(brush).call(brush.move, (visible.current ?? PRESETS[0].range.map(parseDay)).map(x2));

    return () => {
      stopDismiss();
      zoomRect.interrupt().on('.zoom', null).on('.tip', null);
      brushG.interrupt().on('.brush', null).selectAll('*').remove();
      actions.current = null;
    };
  }, [innerW]);

  return (
    <div>
      <div className="viz-controls">
        {PRESETS.map((preset) => (
          <button key={preset.label} type="button" className="btn btn-sm" onClick={() => actions.current?.show(preset.range.map(parseDay))}>
            {preset.label}
          </button>
        ))}
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => actions.current?.reset()}>
          <RotateCcw size={14} aria-hidden="true" /> Reset zoom
        </button>
        {range && (
          <span className="small muted" aria-live="polite">
            Showing {fmtShort(range[0])} – {fmtShort(range[1])}
          </span>
        )}
        <span className="d3c-hint">Drag to pan (two fingers on touch) · Ctrl/⌘ + scroll to zoom · drag or resize the overview window</span>
      </div>

      <div className="viz" ref={wrapRef}>
        <svg ref={svgRef} className="d3c-zoomable" width={width} height={HEIGHT} role="group" aria-label={SUMMARY}>
          <defs>
            <clipPath id={clipId}>
              <rect width={innerW} height={FOCUS_H} />
            </clipPath>
          </defs>
          <g className="focus" transform={`translate(${M.left},${M.top})`}>
            <text className="viz-axis-title" x={-M.left} y={-14}>Daily active learners</text>
            <g className="viz-grid grid" />
            <g clipPath={`url(#${clipId})`}>
              <g className="bands" />
              <path className="area d3c-area" />
              <path className="line d3c-line" />
            </g>
            <g className="viz-axis x-axis" transform={`translate(0,${FOCUS_H})`} />
            <g className="viz-axis y-axis" />
            <rect className="zoom d3c-overlay d3c-pan" width={innerW} height={FOCUS_H} />
            <g className="hover" pointerEvents="none">
              <line className="d3c-crosshair" y2={FOCUS_H} />
              <circle className="d3c-marker" r={4.5} />
            </g>
          </g>
          <g className="context" transform={`translate(${M.left},${M.top + FOCUS_H + GAP})`}>
            <text className="viz-axis-title" y={-8}>Overview – drag or resize the window</text>
            <g className="bands" />
            <path className="area d3c-area" />
            <path className="line d3c-line d3c-line-thin" />
            <g className="viz-axis x-axis" transform={`translate(0,${CONTEXT_H})`} />
            <g className="brush d3c-brush" />
          </g>
        </svg>
        <ChartTooltip tip={tip} />
      </div>

      <DataTable
        caption="Monthly averages of daily active learners"
        columns={['Month', 'Average daily learners']}
        rows={monthly.map((m) => [fmtMonth(m.month), m.average.toLocaleString('en-AU')])}
      />
    </div>
  );
}
