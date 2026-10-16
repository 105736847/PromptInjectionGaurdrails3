/**
 * Beeswarm – every dot is one student, placed by a tiny physics simulation.
 * Pattern: D3 owns the <g>. d3.forceSimulation nudges the dots on every "tick":
 *   forceX → towards the student's score · forceY → towards their group's row
 *   forceCollide → dots never overlap.
 * Changing the grouping only changes forceY's targets and RE-HEATS the simulation
 * (alpha), so the dots flow to their new rows. The simulation lives in a ref: it is
 * created once per size and survives re-renders; the cleanup stops it.
 * Row titles and the name labels of found students are drawn by helpers/swarmLabels.js.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { motion } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { drawRowTitles, joinNameLabels, placeNameLabels } from './helpers/swarmLabels.js';
import { cohort, MAJORS } from './data/cohort.js';

const students = cohort.slice(0, 200);
const GROUPINGS = [
  { id: 'all', label: 'All students', groups: ['All students'], of: () => 'All students' },
  { id: 'major', label: 'By major', groups: MAJORS, of: (d) => d.major },
  { id: 'year', label: 'By year', groups: ['Year 1', 'Year 2', 'Year 3'], of: (d) => `Year ${d.year}` },
];
const M = { top: 8, right: 16, bottom: 40, left: 16 };
const H = 460;
const innerH = H - M.top - M.bottom;
const R = 4.5;
const FOUND_R = R + 2.5; // highlighted dots are bigger
const SUMMARY = "Beeswarm of 200 students' final scores, one dot per student, grouped into rows. "
  + 'Most scores fall between 45 and 80.';
const TABLE_ROWS = [...students].sort((a, b) => b.score - a.score).map((d) => [d.name, d.major, `Year ${d.year}`, d.score]);

export default function Beeswarm() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const sim = useRef(null); // { simulation, nodes, dots, x, ticked, reheat, … } – survives re-renders
  const id = useId();
  const [groupingId, setGroupingId] = useState('major');
  const [query, setQuery] = useState('');
  const [tip, setTip] = useState(null);
  const innerW = Math.max(0, width - M.left - M.right);
  const passX = innerW / 2; // the pass mark, 50, sits halfway along the 0–100 score axis
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length < 2 ? [] : students.filter((d) => d.name.toLowerCase().includes(q));
  }, [query]);

  // 1. Setup: nodes, dots, axis and the simulation – once per width.
  useEffect(() => {
    if (innerW === 0) return undefined;
    const g = d3.select(gRef.current);
    const x = d3.scaleLinear([0, 100], [0, innerW]);
    // After a resize, start every dot where it was (scaled to the new width) instead of re-flowing.
    const previous = new Map((sim.current?.nodes ?? []).map((n) => [n.id, n]));
    const nodes = students.map((d) => {
      const p = previous.get(d.id);
      return { ...d, x: p ? (p.x / sim.current.innerW) * innerW : x(d.score), y: p ? p.y : innerH / 2 }; // D3 adds vx, vy
    });
    const dots = g.select('.dots').selectAll('circle').data(nodes, (d) => d.id).join('circle')
      .attr('class', 'd3c-dot').attr('r', R).style('fill', 'var(--chart-1)');
    g.select('.x-axis').call(d3.axisBottom(x).ticks(innerW < 400 ? 5 : 10));
    g.select('.ring').attr('display', 'none');

    const ticked = () => {
      dots.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
      placeNameLabels(g.select('.labels'), { nodes, obstacles: sim.current.titleBoxes, width: innerW, height: innerH, dotRadius: FOUND_R });
    };
    const simulation = d3.forceSimulation(nodes)
      .force('x', d3.forceX((d) => x(d.score)).strength(0.9))
      .force('y', d3.forceY(innerH / 2).strength(0.1))
      .force('collide', d3.forceCollide(R + 1))
      .on('tick', ticked)
      .stop(); // effect 2 sets the rows and starts it
    // Re-heat: raise alpha so the dots move again. Reduced motion → compute 300 ticks at once instead.
    const reheat = (alpha) => {
      if (motion(1) === 0) {
        simulation.alpha(alpha).tick(300);
        ticked();
      } else {
        simulation.alpha(Math.max(alpha, simulation.alpha())).restart(); // never cool down a running flow
      }
    };
    sim.current = { simulation, nodes, dots, x, ticked, reheat, innerW, titleBoxes: [] };

    // Hover: simulation.find() returns the node nearest to the pointer (within 20px).
    const hide = () => {
      g.select('.ring').attr('display', 'none');
      setTip(null);
    };
    g.select('.overlay')
      .on('pointermove pointerdown', (event) => {
        const d = simulation.find(...d3.pointer(event), 20);
        if (!d) return hide();
        g.select('.ring').attr('display', null).attr('cx', d.x).attr('cy', d.y);
        setTip({
          x: M.left + d.x,
          y: M.top + d.y,
          title: d.name,
          rows: [{ label: 'Final score', value: d.score }, { label: 'Major', value: d.major }, { label: 'Year', value: d.year }],
        });
      })
      .on('pointerleave', (event) => {
        if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
      });
    const stopDismiss = onPointerDownOutside(g.node(), hide); // …until the next tap outside the chart

    return () => {
      stopDismiss();
      simulation.stop(); // a running simulation would keep ticking after unmount
      g.select('.overlay').on('pointermove pointerdown pointerleave', null);
    };
  }, [innerW]);

  // 2. Grouping: new forceY targets + row titles, then re-heat the simulation.
  useEffect(() => {
    const s = sim.current;
    if (!s || innerW === 0) return undefined;
    const { groups, of } = GROUPINGS.find((gr) => gr.id === groupingId);
    const row = d3.scaleBand(groups, [0, innerH]).paddingInner(0.08);
    s.simulation.force('y').y((d) => row(of(d)) + row.bandwidth() / 2 + 8); // row centre (+8: below the title)

    const stats = groups.map((name) => {
      const members = students.filter((d) => of(d) === name);
      return { name, n: members.length, median: d3.median(members, (d) => d.score) };
    });
    const t = d3.select(gRef.current).transition().duration(motion(600));
    const { titles, boxes } = drawRowTitles(d3.select(gRef.current).select('.rows'), stats, { row, x: s.x, t });
    s.titleBoxes = boxes; // the name labels keep off the row titles

    s.reheat(0.9); // → the dots flow to their new rows
    return () => titles.interrupt();
  }, [groupingId, innerW]);

  // 3. Search: highlight matching students and label (up to) three of them.
  useEffect(() => {
    const s = sim.current;
    if (!s) return;
    const ids = new Set(matches.map((d) => d.id));
    s.nodes.forEach((n) => { n.found = ids.has(n.id); }); // placeNameLabels() keeps labels off these dots
    s.dots.classed('d3c-dimmed', (d) => ids.size > 0 && !ids.has(d.id))
      .attr('r', (d) => (ids.has(d.id) ? FOUND_R : R))
      .style('fill', (d) => (ids.has(d.id) ? 'var(--chart-2)' : 'var(--chart-1)'));
    s.dots.filter((d) => ids.has(d.id)).raise();
    // Found dots are bigger, so tell forceCollide – and re-heat a little so their neighbours make room.
    s.simulation.force('collide').radius((d) => (ids.has(d.id) ? FOUND_R + 1 : R + 1));
    joinNameLabels(d3.select(gRef.current).select('.labels'), s.nodes.filter((d) => d.found).slice(0, 3));
    s.reheat(0.3);
    s.ticked(); // place the labels now, even if the simulation is asleep
  }, [matches, innerW]);

  return (
    <div>
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Group students">
          {GROUPINGS.map((gr) => (
            <button key={gr.id} type="button" className={`btn btn-sm ${groupingId === gr.id ? 'active' : ''}`} aria-pressed={groupingId === gr.id} onClick={() => setGroupingId(gr.id)}>
              {gr.label}
            </button>
          ))}
        </div>
        <label className="d3c-slider" htmlFor={`${id}-find`}>
          Find
          <input id={`${id}-find`} className="input d3c-search" type="search" list={`${id}-names`} placeholder="e.g. Priya"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <datalist id={`${id}-names`}>
          {students.map((d) => <option key={d.id} value={d.name} />)}
        </datalist>
        <span className="small muted" aria-live="polite">
          {query.trim().length >= 2 && `${matches.length} ${matches.length === 1 ? 'student matches' : 'students match'}`}
        </span>
      </div>
      <div className="viz" ref={wrapRef}>
        <svg width={width} height={H} role="group" aria-label={SUMMARY}>
          <g ref={gRef} transform={`translate(${M.left},${M.top})`}>
            <line className="d3c-crosshair" x1={passX} x2={passX} y2={innerH} />
            <g className="rows" />
            <g className="dots" />
            <g className="labels" />
            <circle className="ring d3c-ring" r={R + 4} />
            <g className="viz-axis x-axis" transform={`translate(0,${innerH})`} />
            <text className="viz-label-muted" x={passX} y={innerH + 34} textAnchor="middle">Pass mark</text>
            <text className="viz-axis-title" x={innerW} y={innerH + 34} textAnchor="end">Final score</text>
            <rect className="overlay d3c-overlay d3c-scrub" width={innerW} height={innerH} />
          </g>
        </svg>
        <ChartTooltip tip={tip} />
      </div>
      <DataTable caption={`All ${students.length} students, highest score first`} columns={['Student', 'Major', 'Year', 'Score']} rows={TABLE_ROWS} />
    </div>
  );
}
