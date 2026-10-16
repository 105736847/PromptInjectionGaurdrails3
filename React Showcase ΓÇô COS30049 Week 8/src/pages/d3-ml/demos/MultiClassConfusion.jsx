/**
 * MultiClassConfusion – a 5 × 5 confusion matrix with a normalise toggle.
 *
 * Pattern: D3 owns the <g>
 * React renders the outer <svg>, the buttons and the example list; inside
 * gRef, D3's data join (keyed by cell id) creates the cells once and
 * transitions their colour when the mode changes.
 * Two effects, two jobs: one DRAWS (mode / size / theme), one HIGHLIGHTS (hover).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { CLASSES, MATRIX, examplesFor } from './data/multiclass.js';
import { inkOn, motion, num, pct } from './helpers/chart.js';

const MODES = [
  { id: 'count', label: 'Counts', legend: 'URLs' },
  { id: 'row', label: 'Row % (recall)', legend: '% of actual class' },
  { id: 'col', label: 'Column % (precision)', legend: '% of predicted class' },
];
const rowTotals = MATRIX.map((row) => d3.sum(row));
const colTotals = CLASSES.map((_, c) => d3.sum(MATRIX, (row) => row[c]));
// One object per cell – the flat array shape a data join wants.
const CELLS = MATRIX.flatMap((row, r) => row.map((count, c) => ({
  id: `${r}-${c}`, r, c, count, row: count / rowTotals[r], col: count / colTotals[c],
})));
const M = { top: 64, right: 4, left: 92 };
const valueOf = (d, mode) => (mode === 'count' ? d.count : d[mode]);
const formatFor = (mode) => (mode === 'count' ? num : pct);

export default function MultiClassConfusion() {
  const colors = useChartTheme();
  const [ref, { width }] = useElementSize();
  const gRef = useRef(null);
  const [mode, setMode] = useState('count');
  const [hover, setHover] = useState(null); // cell under the pointer / keyboard focus
  const [selected, setSelected] = useState('1-4'); // clicked cell id: "actual-predicted"

  const size = Math.min(width, 520);
  const cell = (size - M.left - M.right) / CLASSES.length;
  const max = mode === 'count' ? d3.max(CELLS, (d) => d.count) : 1;
  const format = formatFor(mode);
  const modeInfo = MODES.find((m) => m.id === mode);
  // sqrt so small (but important!) off-diagonal numbers still get some colour
  const color = useMemo(() => d3.scaleSequentialSqrt([0, max], d3.interpolateRgbBasis(colors.sequential)), [max, colors]);

  // EFFECT 1 – draw / update the cells whenever mode, size or theme change.
  useEffect(() => {
    if (width === 0) return undefined;
    const g = d3.select(gRef.current);
    const t = d3.transition().duration(motion(600)).ease(d3.easeCubicOut);

    const cells = g.selectAll('g.d3ml-mc-cell')
      .data(CELLS, (d) => d.id) // key function: cell "1-4" stays cell "1-4"
      .join((enter) => {
        const cg = enter.append('g').attr('class', 'd3ml-mc-cell').attr('tabindex', 0);
        // Start NEW cells at their real colour – otherwise the first transition fades in from black.
        cg.append('rect').attr('rx', 3).style('fill', (d) => color(valueOf(d, mode)));
        cg.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em');
        return cg;
      })
      .attr('data-cell', (d) => d.id)
      .attr('transform', (d) => `translate(${M.left + d.c * cell},${M.top + d.r * cell})`)
      .attr('aria-label', (d) => `Actual ${CLASSES[d.r]}, predicted ${CLASSES[d.c]}: ${d.count} URLs`)
      // Mouse: hover. Touch: a tap FOCUSES the cell, and a finger "leaves" as soon as it lifts – so only
      // a mouse leaving clears the highlight; after a tap it stays until the next tap elsewhere (blur).
      .on('pointerenter focus', (event, d) => setHover(d))
      .on('pointerleave', (event) => event.pointerType !== 'touch' && setHover(null))
      .on('blur', () => setHover(null))
      .on('click', (event, d) => { setHover(d); setSelected(d.id); })
      .on('keydown', (event, d) => {
        const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (event.key === 'Enter' || event.key === ' ') setSelected(d.id);
        else if (moves[event.key]) {
          const r = Math.max(0, Math.min(4, d.r + moves[event.key][0]));
          const c = Math.max(0, Math.min(4, d.c + moves[event.key][1]));
          g.select(`[data-cell="${r}-${c}"]`).node().focus(); // roving focus with arrow keys
        } else return;
        event.preventDefault();
      });

    // 2px surface gap: each rect is 2px smaller than its slot.
    cells.select('rect').attr('x', 1).attr('y', 1).attr('width', cell - 2).attr('height', cell - 2)
      .transition(t).style('fill', (d) => color(valueOf(d, mode)));
    cells.select('text').attr('x', cell / 2).attr('y', cell / 2)
      .style('font-size', cell < 64 ? '10px' : '12px')
      .text((d) => formatFor(mode)(valueOf(d, mode)))
      .style('opacity', 0)
      .transition(t).style('opacity', 1).style('fill', (d) => inkOn(color(valueOf(d, mode))));

    // Row + column labels (keyed by class name so they are reused, never duplicated)
    const rotate = cell < 84;
    g.selectAll('text.d3ml-mc-row').data(CLASSES, (d) => d).join('text')
      .attr('class', 'viz-label d3ml-mc-row').attr('text-anchor', 'end').attr('dy', '0.35em')
      .attr('x', M.left - 8).attr('y', (d, i) => M.top + (i + 0.5) * cell).text((d) => d);
    g.selectAll('text.d3ml-mc-col').data(CLASSES, (d) => d).join('text')
      .attr('class', 'viz-label d3ml-mc-col').attr('text-anchor', rotate ? 'start' : 'middle')
      .attr('transform', (d, i) => `translate(${M.left + (i + 0.5) * cell},${M.top - 10}) rotate(${rotate ? -35 : 0})`)
      .text((d) => d);

    return () => g.selectAll('*').interrupt(); // stop running transitions on cleanup
  }, [width, cell, mode, color]);

  // EFFECT 2 – highlight: dim everything that is not in the hovered row or column.
  useEffect(() => {
    const g = d3.select(gRef.current);
    g.selectAll('.d3ml-mc-cell')
      .classed('is-dim', (d) => hover !== null && d.r !== hover.r && d.c !== hover.c)
      .classed('is-selected', (d) => d.id === selected);
    g.selectAll('.d3ml-mc-row').classed('is-active', (d, i) => hover?.r === i);
    g.selectAll('.d3ml-mc-col').classed('is-active', (d, i) => hover?.c === i);
  }, [hover, selected, width]);

  const [actual, predicted] = selected.split('-').map(Number);
  const examples = examplesFor(actual, predicted);
  const swatch = hover && color(valueOf(hover, mode)); // the hovered cell's colour

  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Normalise the matrix">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={`btn btn-sm ${mode === m.id ? 'active' : ''}`}
              aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
          ))}
        </div>
      </div>
      <ul className="viz-legend" aria-hidden="true">
        <li className="d3ml-ramp">
          <span>0</span><span className="d3ml-ramp-bar" /><span>{format(max)}</span>
          <span className="subtle">{modeInfo.legend} (sqrt scale)</span>
        </li>
      </ul>

      <div className="d3ml-split">
        <div className="viz" ref={ref}>
          {width > 0 && (
            <svg width={size} height={M.top + cell * CLASSES.length + 4} role="group"
              aria-label="Five by five confusion matrix. Rows are the actual class, columns the predicted class. Use Tab and the arrow keys to read each cell.">
              <text className="viz-axis-title" x={M.left - 8} y={14} textAnchor="end">actual ↓</text>
              <text className="viz-axis-title" x={M.left} y={14}>predicted →</text>
              <g ref={gRef} />
            </svg>
          )}
          {/* Below the cell (above it for the bottom rows): the highlighted ROW stays readable.
              A short, one-line title ("actual → predicted"); the rows spell out which is which. */}
          {hover && (
            <ChartTooltip x={M.left + (hover.c + 0.5) * cell} width={size} placement={hover.r < 3 ? 'below' : 'above'}
              y={hover.r < 3 ? M.top + (hover.r + 1) * cell + 4 : M.top + hover.r * cell - 4}
              title={`${CLASSES[hover.r]} → ${CLASSES[hover.c]}`}>
              {/* The swatch marks the number the cell's colour shows in the current mode
                  (a transparent one keeps the other labels lined up) */}
              <TooltipRow color={mode === 'count' ? swatch : 'transparent'} label="URLs" value={num(hover.count)} />
              <TooltipRow color={mode === 'row' ? swatch : 'transparent'} label={`of actual ${CLASSES[hover.r]}`} value={pct(hover.row)} />
              <TooltipRow color={mode === 'col' ? swatch : 'transparent'} label={`of predicted ${CLASSES[hover.c]}`} value={pct(hover.col)} />
            </ChartTooltip>
          )}
        </div>

        <section className="card-subtle d3ml-examples" aria-live="polite">
          <h4 className="m-0">
            {actual === predicted ? 'Correct' : 'Mistake'}: actual <em>{CLASSES[actual]}</em> → predicted <em>{CLASSES[predicted]}</em>
          </h4>
          <p className="small muted">{num(MATRIX[actual][predicted])} URLs · click any cell (or press Enter) to inspect it.</p>
          {actual === predicted ? (
            <p className="small m-0">The diagonal holds correct predictions. The interesting stories are off the diagonal – try <strong>phishing → spam</strong>.</p>
          ) : examples.length === 0 ? (
            <p className="small m-0">No URLs were confused this way – the model never mixed up these two classes.</p>
          ) : (
            <ul className="d3ml-url-list">
              {examples.map((url) => <li key={url} className="mono">{url}</li>)}
            </ul>
          )}
        </section>
      </div>

      <details className="d3ml-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption className="small muted">Rows = actual class, columns = predicted class · {modeInfo.label}</caption>
            <thead>
              <tr><th scope="col">Actual</th>{CLASSES.map((c) => <th key={c} scope="col" className="num">{c}</th>)}</tr>
            </thead>
            <tbody>
              {CLASSES.map((c, r) => (
                <tr key={c}>
                  <th scope="row">{c}</th>
                  {CLASSES.map((_, col) => <td key={col} className="num">{format(valueOf(CELLS[r * CLASSES.length + col], mode))}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
