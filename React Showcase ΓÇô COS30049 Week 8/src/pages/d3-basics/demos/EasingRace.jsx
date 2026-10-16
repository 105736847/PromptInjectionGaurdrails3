/**
 * EasingRace – d3-transition and d3-ease.
 * Pattern: D3 owns the <g>.
 *
 * Every runner travels the same distance in the same time; only the EASING
 * differs – the function that maps elapsed time t (0 → 1) to progress.
 * The tiny plot left of each row is that function; its dot follows along.
 *
 * Concepts: transition.duration / delay / easeVarying, chained transitions
 * (transition().transition()), NAMED transitions and selection.interrupt().
 * Drawing the rows happens in useEffect; running is an imperative action,
 * so it lives in the click handlers.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Play, CircleStop, RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';

const EASES = ['Linear', 'QuadInOut', 'CubicInOut', 'SinInOut', 'ExpInOut', 'CircleInOut', 'ElasticOut', 'BackOut', 'BounceOut']
  .map((name) => ({ name: `ease${name}`, fn: d3[`ease${name}`] }));
const TOP = 28;
const ROW = 34;
const HEIGHT = TOP + EASES.length * ROW + 6;
const MINI = { w: 44, h: 24 };
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function EasingRace() {
  const [sizeRef, { width }] = useElementSize();
  const [duration, setDuration] = useState(1500);
  const [stagger, setStagger] = useState(false);
  const [chain, setChain] = useState(false);
  const [animateAnyway, setAnimateAnyway] = useState(false);
  const gRef = useRef(null);
  const layoutRef = useRef(null); // scales from the last draw, used by the click handlers
  const timerRef = useRef(null); // d3.timer for the elapsed-time readout

  // Some easings overshoot 1 (elastic, back): find the largest value so the track has room.
  const maxProgress = d3.max(EASES, (e) => d3.max(d3.range(0, 1.001, 0.01), e.fn));

  useEffect(() => {
    if (width === 0) return undefined;
    // Narrow screens: the name goes ABOVE the track, so the track can use the full width.
    const stacked = width < 520;
    const trackStart = MINI.w + 10 + (stacked ? 0 : 128);
    const trackY = stacked ? ROW / 2 + 6 : ROW / 2;
    const track = d3.scaleLinear().domain([0, maxProgress]).range([trackStart + 8, width - 10]);
    const miniX = d3.scaleLinear().range([0, MINI.w]);
    const miniY = d3.scaleLinear().domain([0, maxProgress]).range([MINI.h, 0]);
    layoutRef.current = { track, miniX, miniY, right: width - 10 };
    const g = d3.select(gRef.current);

    // One row per easing. .join() keeps this safe to run again (resize, StrictMode).
    const rows = g
      .selectAll('g.row')
      .data(EASES, (d) => d.name)
      .join((enter) => {
        const row = enter.append('g').attr('class', 'row');
        row.append('rect').attr('class', 'd3-basics-mini-frame');
        row.append('path').attr('class', 'd3-basics-mini-curve');
        row.append('circle').attr('class', 'd3-basics-mini-dot').attr('r', 3);
        row.append('text').attr('class', 'viz-tick d3-basics-ease-name').attr('dy', '0.32em');
        row.append('line').attr('class', 'd3-basics-track');
        row.selectAll('line.d3-basics-finish').data([0, 1]).join('line').attr('class', 'd3-basics-finish'); // start + finish ticks
        row.append('circle').attr('class', 'd3-basics-runner').attr('r', 7);
        return row;
      })
      .attr('transform', (d, i) => `translate(0,${TOP + i * ROW})`);

    rows.select('.d3-basics-mini-frame').attr('y', (ROW - MINI.h) / 2).attr('width', MINI.w).attr('height', MINI.h);
    rows
      .select('.d3-basics-mini-curve')
      .attr('transform', `translate(0,${(ROW - MINI.h) / 2})`)
      .attr('d', (d) => d3.line((t) => miniX(t), (t) => miniY(d.fn(t)))(d3.range(0, 1.0001, 0.02)));
    rows.select('.d3-basics-mini-dot').interrupt('clock')
      .attr('transform', `translate(0,${(ROW - MINI.h) / 2})`).attr('cx', miniX(0)).attr('cy', miniY(0));
    rows.select('.d3-basics-ease-name').attr('x', MINI.w + 10).attr('y', stacked ? 5 : ROW / 2).text((d) => d.name);
    rows.select('.d3-basics-track').attr('x1', track(0)).attr('x2', track(1)).attr('y1', trackY).attr('y2', trackY);
    rows.selectAll('.d3-basics-finish').attr('x1', track).attr('x2', track).attr('y1', trackY - 10).attr('y2', trackY + 10);
    rows.select('.d3-basics-runner').interrupt().attr('cx', track(0)).attr('cy', trackY);

    g.selectAll('text.d3-basics-finish-label')
      .data(['start', 'finish'])
      .join('text')
      .attr('class', 'viz-label-muted d3-basics-finish-label')
      .attr('x', (d, i) => track(i)).attr('y', TOP - 12).attr('text-anchor', 'middle')
      .text((d) => d);

    return () => {
      timerRef.current?.stop();
      g.selectAll('*').interrupt().interrupt('clock');
    };
  }, [width, maxProgress]);

  function run() {
    const g = d3.select(gRef.current);
    const { track, miniX, miniY, right } = layoutRef.current;
    const ms = reduceMotion() && !animateAnyway ? 0 : duration;
    const delay = (d, i) => (stagger ? i * 90 : 0);

    // Runners: one transition, but every element gets its OWN easing via easeVarying.
    const leg = g.selectAll('.d3-basics-runner').interrupt().attr('cx', track(0))
      .transition().duration(ms).delay(delay).easeVarying((d) => d.fn)
      .attr('cx', track(1));
    // A chained transition starts when the previous one ends (and inherits its duration and easing).
    if (chain) leg.transition().attr('cx', track(0));

    // The dots on the mini plots run on a NAMED transition ('clock') with LINEAR time,
    // so they can run at the same time as the unnamed runner transition.
    const follow = (tr) => tr.attrTween('cx', () => (t) => miniX(t)).attrTween('cy', (d) => (t) => miniY(d.fn(t)));
    const clock = follow(g.selectAll('.d3-basics-mini-dot').interrupt('clock')
      .transition('clock').duration(ms).delay(delay).ease(d3.easeLinear));
    if (chain) follow(clock.transition());

    // d3.timer calls back on every animation frame with the elapsed milliseconds.
    const total = ms * (chain ? 2 : 1) + (stagger ? (EASES.length - 1) * 90 : 0);
    const label = g.selectAll('text.d3-basics-clock').data([null]).join('text')
      .attr('class', 'viz-label-muted d3-basics-clock').attr('x', right).attr('y', TOP - 12).attr('text-anchor', 'end');
    timerRef.current?.stop();
    timerRef.current = d3.timer((elapsed) => {
      label.text(`${Math.min(elapsed, total).toFixed(0)} ms`);
      if (elapsed >= total) timerRef.current.stop();
    });
  }

  function interrupt() {
    // interrupt() stops only UNNAMED transitions – the named 'clock' ones need their name.
    d3.select(gRef.current).selectAll('.d3-basics-runner, .d3-basics-mini-dot').interrupt().interrupt('clock');
    timerRef.current?.stop();
  }

  function reset() {
    interrupt();
    const { track, miniX, miniY } = layoutRef.current;
    const g = d3.select(gRef.current);
    g.selectAll('.d3-basics-runner').attr('cx', track(0));
    g.selectAll('.d3-basics-mini-dot').attr('cx', miniX(0)).attr('cy', miniY(0));
    g.selectAll('text.d3-basics-clock').text('');
  }

  return (
    <div className="stack">
      <div className="viz-controls">
        <button type="button" className="btn btn-primary btn-sm" onClick={run} disabled={width === 0}>
          <Play size={15} aria-hidden="true" /> Run
        </button>
        <button type="button" className="btn btn-sm" onClick={interrupt}>
          <CircleStop size={15} aria-hidden="true" /> Interrupt
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={reset} disabled={width === 0}>
          <RotateCcw size={15} aria-hidden="true" /> Reset
        </button>
        <label className="d3-basics-inline-range">
          duration({duration})
          <input type="range" min="250" max="4000" step="250" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </label>
        <label className="switch">
          <input type="checkbox" checked={stagger} onChange={(e) => setStagger(e.target.checked)} />
          <span className="switch-track" /> Stagger (delay)
        </label>
        <label className="switch">
          <input type="checkbox" checked={chain} onChange={(e) => setChain(e.target.checked)} />
          <span className="switch-track" /> Chain: there and back
        </label>
      </div>

      {reduceMotion() && (
        <div className="alert alert-info small">
          <span>
            Your device asks for <strong>reduced motion</strong>, so the runners jump straight to the finish.{' '}
            <label className="check">
              <input type="checkbox" checked={animateAnyway} onChange={(e) => setAnimateAnyway(e.target.checked)} />
              Animate anyway
            </label>
          </span>
        </div>
      )}

      <div ref={sizeRef} className="viz">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Nine runners, one per easing function, racing from start to finish">
            <g ref={gRef} />
          </svg>
        )}
      </div>
    </div>
  );
}
