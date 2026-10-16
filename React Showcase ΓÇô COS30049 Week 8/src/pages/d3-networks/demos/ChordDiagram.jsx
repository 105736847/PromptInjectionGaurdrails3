/**
 * ChordDiagram – students switching between six majors.
 * Each outer arc is a major (its length = students who left + joined); each
 * ribbon is a flow FROM one major TO another, with an arrow at the "to" end.
 *
 * Pattern: D3 calculates, React renders
 * d3.chordDirected() turns the matrix into angles, d3.arc() and
 * d3.ribbonArrow() turn angles into path strings, and React draws <path>s.
 *
 * Colour: ribbons cross each other, so six colours would touch everywhere and
 * be hard to tell apart. Instead every mark is grey and ONE colour (--chart-1)
 * shows what you are looking at; the majors are named by direct labels.
 * Hover / keyboard focus highlights a major for a moment, a click pins it.
 */
import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { MAJORS, transfers } from './data/transfers.js';

const totals = MAJORS.map((_, i) => ({ left: d3.sum(transfers[i]), joined: d3.sum(transfers, (row) => row[i]) }));
const midAngle = (g) => (g.startAngle + g.endAngle) / 2;
// Start with the busiest major pinned, so the diagram opens with one story in colour.
const BUSIEST = d3.maxIndex(totals, (t) => t.left + t.joined);

export default function ChordDiagram() {
  const [wrapRef, { width }] = useElementSize();
  const [hover, setHover] = useState(null); // { group, x, y } or { chord, x, y }
  const [pinned, setPinned] = useState(BUSIEST); // index of the clicked major, or null
  const long = width >= 600; // full names beside the circle, or the short ones on a phone
  const outer = Math.min(200, width / 2 - (long ? 160 : 72)); // leave room for the labels
  const inner = outer - 14;
  const height = 2 * outer + (long ? 84 : 56); // + room for the labels above and below the circle

  // D3 calculates: angles for every group (major) and chord (flow).
  const chords = useMemo(() => (inner > 0
    ? d3.chordDirected().padAngle(12 / inner).sortSubgroups(d3.descending).sortChords(d3.descending)(transfers)
    : null), [inner]);
  if (!chords) return <div ref={wrapRef} className="viz" style={{ minHeight: 300 }} />;

  const arc = d3.arc().innerRadius(inner).outerRadius(outer);
  const ribbon = d3.ribbonArrow().radius(inner - 1).padAngle(1 / inner);

  // What is emphasised? The hovered ribbon, else the hovered major, else the pinned major.
  const focusChord = hover?.chord ?? null;
  const focusGroup = hover ? (hover.group ?? null) : pinned;
  const lit = (c) => (focusChord ? c === focusChord : focusGroup !== null && (c.source.index === focusGroup || c.target.index === focusGroup));
  const litGroup = (i) => (focusChord ? focusChord.source.index === i || focusChord.target.index === i : focusGroup === i);
  const anyFocus = focusChord !== null || focusGroup !== null;
  const ordered = [...chords].sort((a, b) => lit(a) - lit(b)); // highlighted ribbons are drawn last = on top

  const hoverGroup = (g) => { // tooltip at the outer edge of the arc
    const a = midAngle(g) - Math.PI / 2;
    setHover({ group: g.index, x: width / 2 + Math.cos(a) * outer, y: height / 2 + Math.sin(a) * outer });
  };
  const hoverChord = (event, chord) => {
    const [x, y] = d3.pointer(event, event.currentTarget.ownerSVGElement);
    setHover({ chord, x, y });
  };
  const togglePin = (i) => setPinned((p) => (p === i ? null : i));

  return (
    <figure className="m-0">
      <div className="viz-controls">
        <button type="button" className="btn btn-sm" onClick={() => setPinned(null)} disabled={pinned === null}>
          <RotateCcw size={15} aria-hidden="true" />Reset
        </button>
        <span className="subtle small">Hover a major or a ribbon · click (or Enter) pins a major</span>
      </div>
      <ul className="viz-legend">
        <li><span className="viz-swatch" style={{ background: 'var(--chart-1)' }} />Selected major and its flows</li>
        <li><span className="viz-swatch" style={{ background: 'var(--color-text-subtle)', opacity: 0.5 }} />Other flows</li>
        <li className="subtle small">Arrow tip = the major students joined</li>
      </ul>
      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": an img would hide the focusable majors from screen readers */}
        <svg width={width} height={height} role="group" aria-label="Chord diagram of students switching between six majors.">
          <g transform={`translate(${width / 2},${height / 2})`}>
            {ordered.map((c) => (
              <path key={`${c.source.index}-${c.target.index}`} d={ribbon(c)}
                style={{
                  fill: lit(c) ? 'var(--chart-1)' : 'var(--color-text-subtle)',
                  fillOpacity: lit(c) ? 0.8 : anyFocus ? 0.1 : 0.36,
                  stroke: 'var(--color-surface)', strokeWidth: 0.75, // a hairline gap between crossing ribbons
                  transition: 'fill-opacity 200ms', cursor: 'default',
                }}
                onPointerMove={(e) => hoverChord(e, c)} onPointerLeave={() => setHover(null)} />
            ))}
            {chords.groups.map((g) => {
              const a = midAngle(g) - Math.PI / 2; // 0 = pointing right
              const [cos, sin] = [Math.cos(a), Math.sin(a)];
              const { name, short } = MAJORS[g.index];
              return (
                <g key={g.index} tabIndex={0} role="button" aria-pressed={pinned === g.index}
                  aria-label={`${name}: ${totals[g.index].left} left, ${totals[g.index].joined} joined`}
                  style={{ cursor: 'pointer' }} onClick={() => togglePin(g.index)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePin(g.index); } }}
                  onPointerEnter={() => hoverGroup(g)} onPointerLeave={() => setHover(null)}
                  onFocus={() => hoverGroup(g)} onBlur={() => setHover(null)}>
                  <path d={arc(g)} style={{ fill: litGroup(g.index) ? 'var(--chart-1)' : 'var(--color-text-subtle)', stroke: 'var(--color-surface)', strokeWidth: 2, transition: 'fill 200ms' }} />
                  {/* tick every 10 students along the arc */}
                  {d3.range(0, g.value, 10).map((v) => {
                    const t = g.startAngle + (v / g.value) * (g.endAngle - g.startAngle);
                    return <line key={v} transform={`rotate(${(t * 180) / Math.PI - 90}) translate(${outer},0)`} x2={v % 50 === 0 ? 6 : 3}
                      style={{ stroke: 'var(--chart-axis)' }} />;
                  })}
                  {/* Direct label (name + counts), always horizontal: left of the circle it ends at the
                      arc, right of it it starts there, at the top/bottom it is centred. `top` slides the
                      two-line block from below the anchor point (bottom of the circle) to above it (top).
                      It is part of the button, so it widens the 14px-thin arc into a comfortable target. */}
                  <text x={cos * (outer + 12)} y={sin * (outer + 12) - (long ? 28 : 14) * ((1 - sin) / 2)}
                    textAnchor={cos > 0.2 ? 'start' : cos < -0.2 ? 'end' : 'middle'} className="viz-label">
                    <tspan x={cos * (outer + 12)} dy={12} style={{ fontWeight: litGroup(g.index) ? 700 : 500 }}>{long ? name : short}</tspan>
                    {long && ( // a phone has no room beside the circle for the counts – the tooltip has them
                      <tspan x={cos * (outer + 12)} dy={14} className="viz-label-muted">{totals[g.index].left} out · {totals[g.index].joined} in</tspan>
                    )}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {focusChord && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            <div className="viz-tooltip-title">{MAJORS[focusChord.source.index].name} → {MAJORS[focusChord.target.index].name}</div>
            <TooltipRow color="var(--chart-1)" label="Students" value={focusChord.source.value} />
            <TooltipRow label="The other way" value={transfers[focusChord.target.index][focusChord.source.index]} />
          </ChartTooltip>
        )}
        {hover?.group !== undefined && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            <div className="viz-tooltip-title">{MAJORS[hover.group].name}</div>
            <TooltipRow color="var(--chart-1)" label="Left for other majors" value={totals[hover.group].left} />
            <TooltipRow label="Joined from other majors" value={totals[hover.group].joined} />
            <div className="subtle small mt-1">Click to {pinned === hover.group ? 'unpin' : 'pin'}</div>
          </ChartTooltip>
        )}
      </div>
      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>Students who switched major: rows = from, columns = to</caption>
            <thead>
              <tr><th scope="col">From \ To</th>{MAJORS.map((m) => <th key={m.short} scope="col" className="num">{m.short}</th>)}</tr>
            </thead>
            <tbody>
              {transfers.map((row, i) => (
                <tr key={MAJORS[i].short}>
                  <th scope="row">{MAJORS[i].name}</th>
                  {row.map((v, j) => <td key={MAJORS[j].short} className="num">{i === j ? '–' : v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
