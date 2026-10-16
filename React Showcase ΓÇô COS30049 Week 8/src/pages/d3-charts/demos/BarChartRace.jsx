/**
 * BarChartRace – enrolments per degree, 2016–2026 (fictional), as an animated ranking.
 * Pattern: D3 owns the <g>.
 *   • React owns the clock: `frame` is React state. Play starts an interval that advances it; the slider sets it.
 *   • Every frame, an effect joins the bars KEYED BY DEGREE NAME, so each bar keeps its
 *     identity (and its colour) while it slides to its new rank – "object constancy".
 *   • The value labels count smoothly: textTween + d3.interpolateNumber.
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Pause, Play, RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import { barPath, motion } from './helpers/chartKit.js';
import DataTable from './helpers/DataTable.jsx';
import { degrees, keyframes, YEARS, FRAMES_PER_YEAR } from './data/enrolments.js';

const ROW = 42; // vertical space per degree: name label + bar + air
const BAR = 20; // bar thickness (≤ 24px)
const M = { top: 40, right: 58, bottom: 8, left: 6 }; // left: room for half of the centred "0" tick label
const H = M.top + degrees.length * ROW + M.bottom;
const TICK_MS = 260; // one keyframe every 260 ms while playing
const LAST = keyframes.length - 1;
const xMax = d3.max(degrees, (d) => d3.max(d.values));
const fmt = d3.format(',.0f');
const SUMMARY = 'Bar chart race of enrolments per degree from 2016 to 2026. AI and Machine Learning grows from 60 '
  + 'to 2,150 students and becomes the most popular degree in 2025; Information Systems halves.';

export default function BarChartRace() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const sliderId = useId();
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const isPlaying = playing && frame < LAST; // derived: the race stops by itself at the end
  const year = Math.floor(keyframes[frame].year);

  // The clock: while playing, move one keyframe forward every TICK_MS.
  useEffect(() => {
    if (!isPlaying) return undefined;
    const id = setInterval(() => setFrame((f) => Math.min(f + 1, LAST)), TICK_MS);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Draw the current frame.
  useEffect(() => {
    if (width === 0) return undefined;
    const innerW = width - M.left - M.right;
    const g = d3.select(gRef.current);
    const { values } = keyframes[frame];
    const x = d3.scaleLinear([0, xMax], [0, innerW]).nice(); // fixed scale: growth stays visible
    const ranked = degrees.map((d) => ({ ...d, value: values[d.name] })).sort((a, b) => b.value - a.value);
    const rank = new Map(ranked.map((d, i) => [d.name, i]));
    const rowY = (d) => rank.get(d.name) * ROW;
    // Playing → short linear steps that flow into each other; scrubbing → one eased move.
    const t = g.transition().duration(motion(isPlaying ? TICK_MS : 650)).ease(isPlaying ? d3.easeLinear : d3.easeCubicInOut);

    g.select('.x-axis').call(d3.axisTop(x).ticks(innerW / 90).tickFormat(d3.format(',')).tickSize(-degrees.length * ROW));

    const rows = g
      .select('.bars')
      .selectAll('g')
      .data(ranked, (d) => d.name) // the KEY: a degree always gets its own <g>
      .join((enter) => {
        const row = enter.append('g').attr('transform', (d) => `translate(0,${rowY(d)})`);
        row.append('text').attr('class', 'viz-label').attr('y', 12).text((d) => d.name);
        row.append('path').attr('class', 'd3c-bar').attr('transform', 'translate(0,18)').style('--series', (d) => d.color);
        row.append('text').attr('class', 'viz-label d3c-value').attr('y', 18 + BAR / 2).attr('dy', '0.35em');
        return row;
      });

    rows.transition(t).attr('transform', (d) => `translate(0,${rowY(d)})`);
    rows.select('path').transition(t).attr('d', (d) => barPath(0, 0, x(d.value), BAR));
    rows.select('.d3c-value').transition(t)
      .attr('x', (d) => x(d.value) + 6)
      .textTween(function (d) {
        const value = d3.interpolateNumber(this.previous ?? d.value, d.value);
        return (k) => {
          this.previous = value(k); // remember the number ON SCREEN (on the DOM node itself), so an
          return fmt(this.previous); // interrupted count carries on from here instead of jumping
        };
      });

    return () => g.selectAll('*').interrupt();
  }, [frame, width, isPlaying]);

  function togglePlay() {
    if (isPlaying) {
      setPlaying(false);
      return;
    }
    if (frame === LAST) setFrame(0); // at the end, Play starts over
    setPlaying(true);
  }

  const leader = degrees.reduce((best, d) => (keyframes[frame].values[d.name] > keyframes[frame].values[best.name] ? d : best));
  // Pause while playing, Replay at the end, otherwise Play – and a lookup for the matching icon.
  const button = isPlaying ? 'Pause' : frame === LAST ? 'Replay' : 'Play';
  const ButtonIcon = { Play, Pause, Replay: RotateCcw }[button];

  return (
    <div>
      <div className="viz-controls">
        {/* d3c-play gives the button one fixed width, so Play / Pause / Replay never nudge the slider */}
        <button type="button" className="btn btn-sm btn-primary d3c-play" onClick={togglePlay}>
          <ButtonIcon size={14} aria-hidden="true" />
          {button}
        </button>
        <label className="d3c-slider" htmlFor={sliderId}>
          Year
          <input
            id={sliderId}
            type="range"
            min={YEARS[0]}
            max={YEARS.at(-1)}
            step={1}
            value={year}
            onChange={(event) => {
              setPlaying(false);
              setFrame((Number(event.target.value) - YEARS[0]) * FRAMES_PER_YEAR);
            }}
          />
          <output htmlFor={sliderId}>{year}</output>
        </label>
        <span className="small muted" aria-live="polite">Most popular in {year}: {leader.name}</span>
      </div>

      <div className="viz" ref={wrapRef}>
        {/* role="img": nothing inside the SVG can be focused or pointed at, so it may be ONE image.
            (Charts with hover, zoom or focusable marks use role="group" – "img" would hide their children.) */}
        <svg width={width} height={H} role="img" aria-label={SUMMARY}>
          <g ref={gRef} transform={`translate(${M.left},${M.top})`}>
            <text className="viz-axis-title" y={-26}>Students enrolled</text>
            <g className="viz-axis d3c-axis-grid x-axis" />
            <g className="bars" />
            <text className="d3c-year" x={width - M.left - 4} y={degrees.length * ROW - 8}>{year}</text>
          </g>
        </svg>
      </div>

      <DataTable
        columns={['Degree', ...YEARS.map(String)]}
        rows={degrees.map((d) => [d.name, ...d.values.map(fmt)])}
      />
    </div>
  );
}
