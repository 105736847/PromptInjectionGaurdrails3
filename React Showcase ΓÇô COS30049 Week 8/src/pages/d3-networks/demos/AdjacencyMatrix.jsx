/**
 * AdjacencyMatrix – the same kind of network as a node-link graph, drawn as a
 * grid: row = person, column = person, filled cell = they worked together.
 * Matrices never get "hairballs", and the ORDER of the rows reveals clusters.
 *
 * Pattern: D3 owns the <g>
 * The chosen order lives in React state; the effect re-runs with the new order
 * and D3 animates rows and columns into place with staggered transitions
 * (the classic "Les Misérables" matrix by Mike Bostock).
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { motion } from './helpers/motion.js';
import { people, collaborations, weightOf, ORDERS, STUDIOS } from './data/collaboration.js';

const LEFT = 58; // room for row labels
const TOP = 52; // room for the rotated column labels
const opacity = d3.scaleLinear().domain([1, 4]).range([0.35, 1]); // more shared projects → stronger
// Cell colour: the studio's colour for a pair inside one studio, grey for a pair across studios.
const cellColour = (a, b) => (people[a].studio === people[b].studio ? `var(--chart-${people[a].studio + 1})` : 'var(--color-text-subtle)');

// Bold, full-contrast label for the hovered row/column; the others stay muted.
function emphasise(groups, id) {
  groups.select('text')
    .style('fill', (d) => (d.id === id ? 'var(--color-text)' : null))
    .style('font-weight', (d) => (d.id === id ? 600 : null));
}

export default function AdjacencyMatrix() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const [order, setOrder] = useState('cluster');
  const [hover, setHover] = useState(null); // { a, b, weight, x, y }

  const n = people.length;
  const cell = width > 0 ? Math.max(12, Math.min(28, Math.floor((width - LEFT - 4) / n))) : 0;
  const size = cell * n;
  const offsetX = Math.max(0, (width - LEFT - size) / 2); // centre the matrix

  useEffect(() => {
    if (cell === 0) return undefined; // hidden (Code tab) → nothing to draw
    const g = d3.select(gRef.current);
    // A band scale turns "position in the current order" into pixels.
    const sorted = [...people].sort(ORDERS[order].compare).map((p) => p.id);
    const pos = d3.scaleBand().domain(sorted).range([0, size]);
    const gap = cell > 16 ? 2 : 1; // surface-coloured gap between cells
    const delay = (id) => (pos(id) / cell) * motion(28); // stagger: row 0 moves first

    g.selectAll('rect.bg').data([null]).join('rect').attr('class', 'bg')
      .attr('width', size).attr('height', size).style('fill', 'var(--color-surface-2)');
    const bands = g.selectAll('rect.band').data(['row', 'col']).join('rect').attr('class', 'band')
      .style('fill', 'var(--color-primary)').style('opacity', 0);

    // ROWS: one <g> per person with a label and its filled cells.
    const rows = g.selectAll('g.row').data(people, (d) => d.id).join((enter) => {
      const row = enter.append('g').attr('class', 'row').attr('transform', (d) => `translate(0,${pos(d.id)})`);
      row.append('text').attr('x', -6).attr('text-anchor', 'end').attr('dy', '0.32em').text((d) => d.name);
      return row;
    });
    rows.select('text').attr('y', cell / 2).attr('class', 'viz-label-muted');
    rows.selectAll('rect.cell')
      .data((d) => collaborations
        .filter((c) => c.source === d.id || c.target === d.id)
        .map((c) => ({ self: d.id, other: c.source === d.id ? c.target : c.source, weight: c.weight })), (c) => c.other)
      .join((enter) => enter.append('rect').attr('class', 'cell').attr('x', (c) => pos(c.other) + gap / 2))
      .attr('y', gap / 2).attr('width', cell - gap).attr('height', cell - gap).attr('rx', 2)
      .style('fill', (c) => cellColour(c.other, c.self))
      .style('opacity', (c) => opacity(c.weight));

    // COLUMNS: only a rotated label each – the cells live in the rows.
    const cols = g.selectAll('g.col').data(people, (d) => d.id).join((enter) => {
      const col = enter.append('g').attr('class', 'col').attr('transform', (d) => `translate(${pos(d.id)},0)`);
      col.append('text').attr('transform', 'rotate(-90)').attr('x', 6).attr('dy', '0.32em').text((d) => d.name);
      return col;
    });
    cols.select('text').attr('y', cell / 2).attr('class', 'viz-label-muted');

    // ANIMATE into the (new) order. Nested transitions inherit timing from their parent.
    rows.transition().duration(motion(700)).delay((d) => delay(d.id))
      .attr('transform', (d) => `translate(0,${pos(d.id)})`)
      .selectAll('rect.cell').delay((c) => delay(c.other)).attr('x', (c) => pos(c.other) + gap / 2);
    cols.transition().duration(motion(700)).delay((d) => delay(d.id))
      .attr('transform', (d) => `translate(${pos(d.id)},0)`);

    // HOVER: one transparent overlay; the pointer position tells us row + column.
    const overlay = g.selectAll('rect.overlay').data([null]).join('rect').attr('class', 'overlay')
      .attr('width', size).attr('height', size).style('fill', 'transparent');
    overlay.on('pointermove', (event) => {
      const [mx, my] = d3.pointer(event);
      const a = sorted[Math.min(n - 1, Math.floor(my / cell))];
      const b = sorted[Math.min(n - 1, Math.floor(mx / cell))];
      bands.attr('x', (k) => (k === 'row' ? 0 : pos(b))).attr('y', (k) => (k === 'row' ? pos(a) : 0))
        .attr('width', (k) => (k === 'row' ? size : cell)).attr('height', (k) => (k === 'row' ? cell : size))
        .style('opacity', 0.1);
      emphasise(rows, a);
      emphasise(cols, b);
      setHover({ a, b, weight: weightOf(a, b), x: offsetX + LEFT + pos(b) + cell / 2, y: TOP + pos(a) });
    }).on('pointerleave', () => {
      bands.style('opacity', 0);
      emphasise(rows, null);
      emphasise(cols, null);
      setHover(null);
    });

    return () => {
      g.selectAll('*').interrupt();
      overlay.on('pointermove pointerleave', null);
    };
  }, [order, cell, size, n, offsetX]);

  const topPairs = [...collaborations].sort((x, y) => y.weight - x.weight).slice(0, 8);

  return (
    <figure className="m-0">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Order rows and columns">
          {Object.entries(ORDERS).map(([key, { label }]) => (
            <button key={key} type="button" className={`btn btn-sm${order === key ? ' active' : ''}`}
              aria-pressed={order === key} onClick={() => setOrder(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul className="viz-legend">
        {STUDIOS.map((s, i) => (
          <li key={s}><span className="viz-swatch" style={{ background: `var(--chart-${i + 1})` }} />{s}</li>
        ))}
        <li><span className="viz-swatch" style={{ background: 'var(--color-text-subtle)' }} />Across studios</li>
        <li className="subtle small">Stronger colour = more shared projects</li>
      </ul>

      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": the matrix reacts to the pointer (hover highlight + tooltip);
            role="img" is only for purely static graphics */}
        <svg width={width} height={cell ? TOP + size + 4 : 0} role="group"
          aria-label={`Adjacency matrix of ${n} students; filled cells mark pairs who worked together, ordered ${ORDERS[order].label.toLowerCase()}.`}>
          <g transform={`translate(${offsetX + LEFT},${TOP})`}>
            <g ref={gRef} />
          </g>
        </svg>
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            {hover.a === hover.b ? ( // the diagonal: one person
              <>
                <div className="viz-tooltip-title">{people[hover.a].name}</div>
                <TooltipRow color={`var(--chart-${people[hover.a].studio + 1})`} label="Studio" value={STUDIOS[people[hover.a].studio]} />
                <TooltipRow label="Worked with" value={`${people[hover.a].degree} ${people[hover.a].degree === 1 ? 'person' : 'people'}`} />
              </>
            ) : (
              <>
                <div className="viz-tooltip-title">{people[hover.a].name} &amp; {people[hover.b].name}</div>
                <TooltipRow color={hover.weight ? cellColour(hover.a, hover.b) : 'var(--color-surface-2)'} label="Shared projects" value={hover.weight} />
                <TooltipRow label="Studio" value={people[hover.a].studio === people[hover.b].studio ? STUDIOS[people[hover.a].studio] : 'Across studios'} />
              </>
            )}
          </ChartTooltip>
        )}
      </div>

      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>The {topPairs.length} strongest collaborations</caption>
            <thead><tr><th scope="col">Pair</th><th scope="col">Studio</th><th scope="col" className="num">Shared projects</th></tr></thead>
            <tbody>
              {topPairs.map((c) => (
                <tr key={`${c.source}-${c.target}`}>
                  <th scope="row">{people[c.source].name} &amp; {people[c.target].name}</th>
                  <td>{STUDIOS[people[c.source].studio]}</td>
                  <td className="num">{c.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
