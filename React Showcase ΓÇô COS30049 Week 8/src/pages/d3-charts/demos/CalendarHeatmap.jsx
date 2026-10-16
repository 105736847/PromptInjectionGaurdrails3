/**
 * CalendarHeatmap – a year of daily study minutes for one (fictional) project team.
 * Pattern: D3 owns the <g>. Every day is a <rect> keyed by its day-of-year, so switching
 * years transitions the SAME cells to their new colours – a small delay per week column
 * makes the change sweep across the year like a wave.
 * Colours are real values from useChartTheme(), so `colors` is an effect dependency:
 * toggling the theme re-runs the effect and the cells fade to the new palette.
 * Keyboard: Tab into the grid, then arrow keys move by day / week ("roving tabindex").
 * Touch: a tapped day keeps its tooltip until the next tap outside the chart.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { motion } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { studyLog, STUDY_YEARS } from './data/studyLog.js';

const LABEL_W = 30; // room for Mon / Wed / Fri
const MONTH_H = 18; // room for the month names
const SEG_GAP = 16; // gap between the two half-years on narrow screens
const THRESHOLDS = [1, 30, 60, 120, 180]; // minutes → 6 colour classes
const CLASS_LABELS = ['0', '1–29', '30–59', '60–119', '120–179', '180+'];
const fmtDay = d3.utcFormat('%a %-d %b %Y');
const fmtMonth = d3.utcFormat('%b');
// Zero days get a neutral grey; study days five steps of a single-hue ramp (weak → strong = little → a lot).
// We skip step 0: it is the step closest to the page background – pale blue in light mode, navy in
// dark mode – so "1–29 min" would be hard to tell apart from the grey "0" squares.
const paletteFor = (colors) => [colors.grid, ...[1, 2, 3, 5, 6].map((i) => colors.sequential[i])];

// Where does each day go? One strip (Jan–Dec) when there is room, else two (Jan–Jun, Jul–Dec).
function makeLayout(year, width) {
  const split = (width - LABEL_W) / 54 < 11;
  const starts = (split ? [0, 6] : [0]).map((month) => d3.utcMonday.floor(new Date(Date.UTC(year, month, 1))));
  const cell = Math.max(8, Math.min(18, Math.floor((width - LABEL_W) / (split ? 27 : 54))));
  const segTop = (seg) => seg * (MONTH_H + 7 * cell + SEG_GAP);
  const place = (date) => {
    const seg = split && date.getUTCMonth() >= 6 ? 1 : 0;
    const col = d3.utcMonday.count(starts[seg], date); // whole weeks since the segment's first Monday
    const row = (date.getUTCDay() + 6) % 7; // Monday = 0 … Sunday = 6
    return { col, row, seg, x: LABEL_W + col * cell, y: segTop(seg) + MONTH_H + row * cell };
  };
  return { cell, place, segTop, segments: starts.length, height: segTop(starts.length) - SEG_GAP };
}

export default function CalendarHeatmap() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const active = useRef(0); // index of the one cell that is in the Tab order
  const colors = useChartTheme();
  const [year, setYear] = useState(STUDY_YEARS.at(-1));
  const [tip, setTip] = useState(null);
  const days = studyLog[year];
  const layout = useMemo(() => makeLayout(year, width), [year, width]);
  const palette = paletteFor(colors);

  useEffect(() => {
    if (width === 0) return undefined;
    const g = d3.select(gRef.current);
    const { cell, place, segTop } = layout;
    const palette = paletteFor(colors);
    const color = d3.scaleThreshold(THRESHOLDS, palette);
    active.current = Math.min(active.current, days.length - 1); // 2024 has 366 days, 2025 has 365
    const show = (d) => {
      const p = place(d.date);
      cells.classed('is-active', (c) => c === d); // outline the day (a finger can't "hover")
      setTip({
        x: p.x + cell / 2,
        y: p.y + cell / 2,
        title: fmtDay(d.date),
        rows: [{ key: 'swatch', color: color(d.minutes), label: 'Studied', value: `${d.minutes} min` }],
      });
    };
    const hide = () => {
      cells.classed('is-active', false);
      setTip(null);
    };

    const cells = g.select('.cells').selectAll('rect')
      .data(days, (d) => d.dayOfYear)
      .join(
        (enter) => enter.append('rect').attr('class', 'd3c-cell').attr('rx', 2)
          .attr('x', (d) => place(d.date).x).attr('y', (d) => place(d.date).y).style('fill', palette[0]),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr('width', cell - 2).attr('height', cell - 2)
      .attr('tabindex', (d, i) => (i === active.current ? 0 : -1))
      .attr('role', 'img')
      .attr('aria-label', (d) => `${fmtDay(d.date)}: ${d.minutes} minutes`)
      .on('pointerenter', (event, d) => show(d))
      .on('focus', (event, d) => {
        active.current = d.dayOfYear;
        show(d);
      })
      .on('pointerleave', (event) => {
        if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
      })
      .on('blur', hide);
    const stopDismiss = onPointerDownOutside(g.node(), hide); // …until the next tap outside the chart

    // The wave: delay each cell by its week column.
    cells.transition().duration(motion(500)).delay((d) => motion(place(d.date).col * 14))
      .attr('x', (d) => place(d.date).x).attr('y', (d) => place(d.date).y)
      .style('fill', (d) => color(d.minutes));

    // Arrow keys: ← → one week, ↑ ↓ one day, Home / End first / last day.
    g.on('keydown', (event) => {
      const step = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, Home: -999, End: 999 }[event.key];
      if (step === undefined) return;
      event.preventDefault();
      active.current = Math.max(0, Math.min(days.length - 1, active.current + step));
      cells.attr('tabindex', (d, i) => (i === active.current ? 0 : -1));
      cells.nodes()[active.current].focus();
    });

    // Month names (top of each segment) and weekday names (left).
    const months = d3.utcMonths(new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1)));
    g.select('.months').selectAll('text').data(months).join('text')
      .attr('class', 'viz-label-muted')
      .attr('x', (m) => place(m).x + (place(m).row === 0 ? 0 : cell)) // month starts mid-week → next column
      .attr('y', (m) => segTop(place(m).seg) + MONTH_H - 6)
      .text(fmtMonth);
    const weekdays = d3.range(layout.segments).flatMap((seg) => ['Mon', 'Wed', 'Fri'].map((name, i) => ({ name, seg, row: i * 2 })));
    g.select('.weekdays').selectAll('text').data(weekdays).join('text')
      .attr('class', 'viz-label-muted')
      .attr('y', (d) => segTop(d.seg) + MONTH_H + d.row * cell + cell / 2)
      .attr('dy', '0.35em')
      .text((d) => d.name);

    return () => {
      stopDismiss();
      g.on('keydown', null);
      cells.interrupt().on('pointerenter focus pointerleave blur', null);
    };
  }, [days, layout, width, year, colors]);

  // Summary numbers are derived during render – no state needed.
  const stats = useMemo(() => {
    let streak = 0;
    let longest = 0;
    for (const d of days) {
      streak = d.minutes > 0 ? streak + 1 : 0;
      longest = Math.max(longest, streak);
    }
    return {
      hours: Math.round(d3.sum(days, (d) => d.minutes) / 60),
      activeDays: days.filter((d) => d.minutes > 0).length,
      longest,
      busiest: d3.greatest(days, (d) => d.minutes),
    };
  }, [days]);
  const monthly = d3.rollups(days, (v) => ({ hours: d3.sum(v, (d) => d.minutes) / 60, active: v.filter((d) => d.minutes > 0).length }), (d) => d.date.getUTCMonth());

  return (
    <div>
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Year">
          {STUDY_YEARS.map((y) => (
            <button key={y} type="button" className={`btn btn-sm ${year === y ? 'active' : ''}`} aria-pressed={year === y} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </div>
      <ul className="viz-legend" aria-label="Minutes studied per day">
        {CLASS_LABELS.map((label, i) => (
          <li key={label}>
            <span className="viz-swatch" style={{ background: palette[i] }} aria-hidden="true" />
            {label}
          </li>
        ))}
        <li>min / day</li>
      </ul>
      <div className="viz" ref={wrapRef}>
        <svg width={width} height={layout.height} role="group" aria-label={`Calendar heatmap of study minutes per day in ${year}. Use the arrow keys to move between days.`}>
          <g ref={gRef}>
            <g className="months" />
            <g className="weekdays" />
            <g className="cells" />
          </g>
        </svg>
        <ChartTooltip tip={tip} />
      </div>
      <dl className="d3c-stats d3c-stats-below">
        <div className="d3c-stat"><dt>Total study time</dt><dd>{stats.hours} h</dd></div>
        <div className="d3c-stat"><dt>Days with study</dt><dd>{stats.activeDays}</dd></div>
        <div className="d3c-stat"><dt>Longest streak</dt><dd>{stats.longest} days</dd></div>
        <div className="d3c-stat"><dt>Busiest day</dt><dd>{stats.busiest.minutes} min <small>{fmtDay(stats.busiest.date)}</small></dd></div>
      </dl>
      <DataTable
        caption={`Study time per month, ${year}`}
        columns={['Month', 'Hours', 'Days with study']}
        rows={monthly.map(([month, m]) => [fmtMonth(new Date(Date.UTC(year, month, 1))), m.hours.toFixed(1), m.active])}
      />
    </div>
  );
}
