/**
 * BarsD3Owns – chart B of TwoWaysDemo.jsx.
 * Pattern: D3 owns the <g>.
 *
 * React renders an EMPTY <g ref={gRef} /> and never touches what is inside it.
 * After every render, useEffect hands that <g> to D3, which creates, updates
 * and removes elements with selection.join() and animates them with
 * d3-transition. Same chart as BarsReactRenders.jsx – different owner.
 *
 * Rules that keep this pattern safe in React:
 *   1. The effect must be IDEMPOTENT (StrictMode runs it twice in development):
 *      use .join() – never a bare .append() that would add a second copy.
 *   2. The effect must CLEAN UP: interrupt transitions that are still running.
 */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import { hBarPath } from './helpers/barPath.js';
import { MAX_STUDENTS } from './data/unitEnrolments.js';

const ROW = 30;
const MARGIN = { top: 8, right: 44, bottom: 28, left: 76 };

export default function BarsD3Owns({ data }) {
  const [ref, { width }] = useElementSize();
  const gRef = useRef(null);
  const height = MARGIN.top + data.length * ROW + MARGIN.bottom;

  useEffect(() => {
    if (width === 0) return undefined; // hidden (e.g. the Code tab is open) – nothing to draw

    const g = d3.select(gRef.current);
    const x = d3.scaleLinear().domain([0, MAX_STUDENTS]).range([MARGIN.left, width - MARGIN.right]);
    const y = d3.scaleBand().domain(data.map((d) => d.unit)).range([MARGIN.top, height - MARGIN.bottom]).padding(0.3);
    const ticks = width < 420 ? 3 : 6;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // One transition object shared by every element → they all move in sync.
    const t = g.transition().duration(reduceMotion ? 0 : 600).ease(d3.easeCubicInOut);

    // .data([null]).join('g') = "make sure exactly ONE of these exists" (safe to re-run).
    g.selectAll('g.grid')
      .data([null])
      .join('g')
      .attr('class', 'grid viz-grid')
      .attr('transform', `translate(0,${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x).ticks(ticks).tickSize(-(height - MARGIN.top - MARGIN.bottom)).tickFormat(''));
    g.selectAll('g.x-axis')
      .data([null])
      .join('g')
      .attr('class', 'x-axis viz-axis')
      .attr('transform', `translate(0,${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x).ticks(ticks).tickSize(0).tickPadding(10))
      .call((axis) => axis.select('.domain').remove());

    // THE DATA JOIN: one <g class="row"> per unit, matched by KEY (the unit code).
    const rows = g
      .selectAll('g.row')
      .data(data, (d) => d.unit)
      .join((enter) => {
        // ENTER: build the elements once; new bars start at length 0.
        const row = enter.append('g').attr('class', 'row').attr('transform', (d) => `translate(0,${y(d.unit)})`);
        row.append('rect').attr('class', 'd3-basics-hit');
        row.append('text').attr('class', 'viz-tick unit').attr('text-anchor', 'end').attr('dy', '0.32em');
        row.append('path').attr('class', 'd3-basics-bar').attr('d', hBarPath(x(0), 0, 0, y.bandwidth()));
        row.append('text').attr('class', 'viz-label value').attr('dy', '0.32em').style('opacity', 0);
        return row;
      }); // UPDATE (default: keep) and EXIT (default: remove) need no special code here

    // Everything below runs for entering AND updating rows.
    rows.transition(t).attr('transform', (d) => `translate(0,${y(d.unit)})`);
    rows.select('.d3-basics-hit').attr('x', 0).attr('y', -4).attr('width', width).attr('height', y.bandwidth() + 8);
    rows.select('.unit').attr('x', MARGIN.left - 8).attr('y', y.bandwidth() / 2).text((d) => d.unit);
    rows.select('.d3-basics-bar').transition(t).attr('d', (d) => hBarPath(x(0), 0, x(d.students) - x(0), y.bandwidth()));
    rows
      .select('.value')
      .attr('y', y.bandwidth() / 2)
      .text((d) => d.students)
      .transition(t)
      .attr('x', (d) => x(d.students) + 6);

    // D3 event handlers receive (event, datum).
    function highlight(unit) {
      rows.style('opacity', (d) => (unit && d.unit !== unit ? 0.45 : 1));
      rows.select('.value').style('opacity', (d) => (d.unit === unit ? 1 : 0));
    }
    rows.on('pointerenter', (event, d) => highlight(d.unit)).on('pointerleave', () => highlight(null));

    // Cleanup runs before the next effect and on unmount: stop running transitions.
    return () => {
      g.interrupt();
      g.selectAll('*').interrupt();
    };
  }, [data, width, height]);

  return (
    <div ref={ref} className="viz">
      {width > 0 && (
        // role="group", not "img": the rows respond to the pointer, and the value labels stay readable
        <svg width={width} height={height} role="group" aria-label="Horizontal bar chart of students per unit">
          <g ref={gRef} />
        </svg>
      )}
    </div>
  );
}
