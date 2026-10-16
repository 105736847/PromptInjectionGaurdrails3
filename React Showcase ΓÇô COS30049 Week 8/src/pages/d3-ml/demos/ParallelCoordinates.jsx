/**
 * ParallelCoordinates – 60 hyper-parameter runs, one line each, five axes.
 * Drag vertically on any axis to brush a range; brushes on several axes
 * combine (AND). Drag an axis title sideways (or focus it and press ← →)
 * to reorder the axes.
 *
 * Pattern: mixed
 * React renders the lines – a pure function of `filters`. D3 owns each axis
 * <g>: d3.axisLeft draws the ticks and d3.brushY adds a brush whose events
 * update React state. The axes come AFTER the lines in the SVG, so they are
 * painted on top, and their tick labels wear a surface-coloured halo.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FunnelX } from 'lucide-react';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { DIMENSIONS, RUNS } from './data/hyperparams.js';

const HEIGHT = 340;
const M = { top: 44, right: 40, bottom: 14, left: 48 };
// One y scale per dimension – they only depend on the data, so build them once.
const Y = Object.fromEntries(DIMENSIONS.map((dim) => {
  const make = dim.type === 'log' ? d3.scaleLog : d3.scaleLinear;
  return [dim.key, make(d3.extent(RUNS, (r) => r[dim.key]), [HEIGHT - M.bottom, M.top]).nice()];
}));
const FORMAT = Object.fromEntries(DIMENSIONS.map((dim) => [dim.key, d3.format(dim.format)]));

export default function ParallelCoordinates() {
  const colors = useChartTheme();
  const [ref, { width }] = useElementSize();
  const axisRefs = useRef({}); // key → the <g> that D3 owns
  const brushes = useRef({}); // key → { brush, brushG } (for "clear filters")
  const filtersRef = useRef({});
  const [order, setOrder] = useState(DIMENSIONS.map((d) => d.key));
  const [filters, setFilters] = useState({}); // key → [low, high]
  const [hover, setHover] = useState(null); // { run, px, py }
  const [drag, setDrag] = useState(null); // { key, x } while an axis title is dragged
  const ready = width > 0;
  const lastKey = order[order.length - 1];

  useEffect(() => { filtersRef.current = filters; }, [filters]); // latest filters for the effect below

  // D3 draws the axis ticks once the SVG exists – and again when another axis becomes the
  // rightmost one: that axis puts its labels on the RIGHT, in the empty margin, instead of
  // under the lines that all converge on it. (Declared first, so the brushes end up on top.)
  useEffect(() => {
    if (!ready) return;
    DIMENSIONS.forEach((dim) => {
      const right = dim.key === lastKey;
      d3.select(axisRefs.current[dim.key]).attr('class', 'viz-axis')
        .call((right ? d3.axisRight : d3.axisLeft)(Y[dim.key]).ticks(5, dim.format).tickSizeOuter(0))
        .attr('text-anchor', right ? 'start' : 'end'); // d3.axis sets this only on its FIRST draw
    });
  }, [ready, lastKey]);

  // …and one brush per axis (again after the SVG was hidden and re-mounted).
  useEffect(() => {
    if (!ready) return undefined;
    const cleanups = DIMENSIONS.map((dim) => {
      const y = Y[dim.key];
      const brush = d3.brushY().extent([[-12, M.top - 4], [12, HEIGHT - M.bottom + 4]])
        .on('start brush end', (event) => {
          setFilters((current) => {
            const next = { ...current }; // copy – never mutate state
            if (event.selection) next[dim.key] = event.selection.map(y.invert).reverse(); // pixels → [low, high]
            else delete next[dim.key];
            return next;
          });
        });
      const brushG = d3.select(axisRefs.current[dim.key]).selectAll('g.brush').data([null]).join('g').attr('class', 'brush').call(brush);
      brushes.current[dim.key] = { brush, brushG };
      const saved = filtersRef.current[dim.key]; // restore a brush after a re-mount
      if (saved) brushG.call(brush.move, [y(saved[1]), y(saved[0])]);
      return () => brushG.on('.brush', null);
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [ready]);

  if (!ready) return <div ref={ref} style={{ height: HEIGHT }} />;

  // --- everything below is plain "D3 calculates, React renders" -------------
  const x = d3.scalePoint(order, [M.left, width - M.right]);
  const pos = (key) => (drag?.key === key ? drag.x : x(key));
  const liveOrder = [...order].sort((a, b) => pos(a) - pos(b)); // follows a dragged axis (for the lines)
  const path = (run) => d3.line()(liveOrder.map((k) => [pos(k), Y[k](run[k])]));
  const color = d3.scaleSequential(d3.extent(RUNS, (r) => r.val_f1), d3.interpolateRgbBasis(colors.sequential.slice(2)));
  const inRange = (run) => Object.entries(filters).every(([k, [lo, hi]]) => run[k] >= lo && run[k] <= hi);
  const kept = RUNS.filter(inRange);
  const best = d3.greatest(kept, (r) => r.val_f1);
  const shortLabels = x.step() < 110;

  function moveAxis(key, direction) {
    const i = order.indexOf(key);
    const j = i + direction;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  }

  // Drop – or the browser cancelled the gesture / took the capture away: commit, stop dragging.
  function finishDrag() {
    if (!drag) return;
    setOrder(liveOrder);
    setDrag(null);
  }

  function pointerX(event) { // ±1px: dragged all the way to an end, an axis passes the one that sits there
    return Math.max(M.left - 1, Math.min(width - M.right + 1, d3.pointer(event.nativeEvent, event.currentTarget.ownerSVGElement)[0]));
  }

  const showTip = (run) => (event) => {
    const [px, py] = d3.pointer(event.nativeEvent, event.currentTarget.ownerSVGElement);
    setHover({ run, px, py });
  };
  // Touch: a finger "leaves" as it lifts, so a tapped tooltip stays until a press off the lines (<svg> below).
  const hideTip = (event) => event.pointerType !== 'touch' && setHover(null);

  return (
    <div className="stack" ref={ref}>
      <div className="viz-controls">
        <span className="small"><strong>{kept.length}</strong> of {RUNS.length} runs kept</span>
        {best && (
          <span className="small muted">
            Best kept: val F1 <strong>{FORMAT.val_f1(best.val_f1)}</strong> (lr {FORMAT.learning_rate(best.learning_rate)}, depth {best.max_depth}, {best.n_estimators} trees)
          </span>
        )}
        <button type="button" className="btn btn-sm btn-ghost" disabled={Object.keys(filters).length === 0}
          onClick={() => Object.values(brushes.current).forEach(({ brush, brushG }) => brushG.call(brush.move, null))}>
          <FunnelX size={14} /> Clear filters
        </button>
      </div>
      <ul className="viz-legend" aria-hidden="true">
        <li className="d3ml-ramp">
          <span>{FORMAT.val_f1(color.domain()[0])}</span><span className="d3ml-ramp-bar is-short" /><span>{FORMAT.val_f1(color.domain()[1])}</span>
          <span className="subtle">line colour = val F1</span>
        </li>
      </ul>

      <div className="viz">
        <svg className="d3ml-pc" width={width} height={HEIGHT} role="group" aria-label="Parallel coordinates of 60 hyper-parameter runs. Brush an axis to filter."
          onPointerDown={(event) => !event.target.classList.contains('d3ml-pc-hit') && setHover(null)}>
          <g className="d3ml-pc-lines">
            {RUNS.filter((r) => !inRange(r)).map((r) => <path key={r.id} d={path(r)} className="d3ml-pc-line is-out" />)}
            {kept.map((r) => (
              <path key={r.id} d={path(r)} className={`d3ml-pc-line ${hover && hover.run.id !== r.id ? 'is-faded' : ''}`}
                style={{ stroke: color(r.val_f1), strokeWidth: hover?.run.id === r.id ? 3 : 1.5 }} />
            ))}
            {/* Wide invisible copies = generous hover targets */}
            {kept.map((r) => (
              <path key={r.id} d={path(r)} className="d3ml-pc-hit" onPointerMove={showTip(r)} onClick={showTip(r)} onPointerLeave={hideTip} />
            ))}
          </g>

          {/* The axes render in the COMMITTED order. If they followed liveOrder, React would move
              the dragged <g> in the DOM mid-drag – and the browser drops the pointer capture. */}
          {order.map((key) => (
            <g key={key} transform={`translate(${pos(key)},0)`}>
              <g ref={(el) => { axisRefs.current[key] = el; }} />
              <text className="viz-label d3ml-pc-title" y={M.top - 22} textAnchor="middle" tabIndex={0}
                aria-label={`${key} axis. Drag, or press left and right arrow keys, to move it.`}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag({ key, x: pos(key) }); }}
                onPointerMove={(e) => drag?.key === key && setDrag({ key, x: pointerX(e) })}
                onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); moveAxis(key, e.key === 'ArrowLeft' ? -1 : 1); }
                }}>
                {shortLabels ? DIMENSIONS.find((d) => d.key === key).short : key}
              </text>
            </g>
          ))}
        </svg>
        {hover && (
          <ChartTooltip x={hover.px} y={hover.py} width={width} title={`Run #${hover.run.id}`}>
            {/* The line's colour encodes val F1, so that row gets the key */}
            <TooltipRow keyType="line" color={color(hover.run.val_f1)} label="val_f1" value={FORMAT.val_f1(hover.run.val_f1)} />
            {order.filter((k) => k !== 'val_f1').map((k) => (
              <TooltipRow key={k} keyType="line" color="transparent" label={k} value={FORMAT[k](hover.run[k])} />
            ))}
          </ChartTooltip>
        )}
      </div>

      <details className="d3ml-details">
        <summary>Show data table</summary>
        <div className="table-wrap d3ml-table-scroll">
          <table className="table">
            <caption className="small muted">The {kept.length} kept runs, best val F1 first</caption>
            <thead><tr>{DIMENSIONS.map((d) => <th key={d.key} scope="col" className="num">{d.key}</th>)}</tr></thead>
            <tbody>
              {[...kept].sort((a, b) => b.val_f1 - a.val_f1).map((r) => (
                <tr key={r.id}>{DIMENSIONS.map((d) => <td key={d.key} className="num">{FORMAT[d.key](r[d.key])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
