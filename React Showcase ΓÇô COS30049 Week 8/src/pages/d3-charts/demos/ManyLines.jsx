/**
 * ManyLines – seven units' weekly submissions on one chart, without the spaghetti.
 * Pattern: D3 owns the <g>. React keeps the state (hidden units, emphasised unit) and
 * two effects draw it:
 *   1. data effect     – joins one <g> per visible unit (keyed by id), transitions lines + y-axis
 *   2. emphasis effect – only toggles a CSS class, so hovering never re-runs the data join
 * Colour follows the unit (unit.color), never its position – toggling never repaints the others.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { motion } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { units, WEEKS } from './data/submissions.js';

const M = { top: 14, bottom: 40, left: 44 }; // the right margin depends on the width (see below)
const H = 340;
const innerH = H - M.top - M.bottom;
const SUMMARY = 'Line chart of weekly submissions for seven units. Each unit spikes in its deadline weeks; '
  + 'Innovation Project, Cloud Computing and UX Design all peak again in week 12.';

// End labels: start each label at its line's end, then push overlapping neighbours apart
// a little at a time ("relaxation") until nothing overlaps. Returns id → label y.
function spreadLabels(items, gap, maxY) {
  const placed = items.map((d) => ({ ...d, ly: d.y })).sort((a, b) => a.y - b.y);
  for (let pass = 0; pass < 50; pass += 1) {
    let moved = false;
    for (let i = 1; i < placed.length; i += 1) {
      const overlap = gap - (placed[i].ly - placed[i - 1].ly);
      if (overlap > 0.5) {
        placed[i - 1].ly -= overlap / 2;
        placed[i].ly += overlap / 2;
        moved = true;
      }
    }
    placed.forEach((d) => { d.ly = Math.max(0, Math.min(maxY, d.ly)); });
    if (!moved) break;
  }
  return new Map(placed.map((d) => [d.id, d.ly]));
}

export default function ManyLines() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const [hidden, setHidden] = useState(() => new Set());
  const [emphasis, setEmphasis] = useState(null); // id of the unit under the pointer / focus
  const [tip, setTip] = useState(null);
  const visible = useMemo(() => units.filter((u) => !hidden.has(u.id)), [hidden]);
  // A hidden unit can't be emphasised. Derive that while rendering – no extra state to keep in sync.
  const emphasised = hidden.has(emphasis) ? null : emphasis;
  // End labels need ~104px on the right. Phones don't have it: there the legend + tooltip name the lines.
  const labelled = width >= 480;
  const innerW = Math.max(0, width - M.left - (labelled ? 104 : 12));

  function toggle(id) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < units.length - 1) next.add(id); // always keep one line
      return next;
    });
  }

  // 1. Data effect
  useEffect(() => {
    if (innerW === 0) return undefined;
    const g = d3.select(gRef.current);
    const x = d3.scaleLinear([1, WEEKS.length], [0, innerW]);
    const y = d3.scaleLinear([0, d3.max(visible, (u) => d3.max(u.values))], [innerH, 0]).nice();
    const line = d3.line().x((v, i) => x(i + 1)).y((v) => y(v)).curve(d3.curveMonotoneX);
    const t = g.transition().duration(motion(600));

    g.select('.x-axis').call(d3.axisBottom(x).tickValues(innerW < 380 ? [2, 4, 6, 8, 10, 12] : WEEKS).tickFormat((w) => `W${w}`));
    g.select('.y-axis').transition(t).call(d3.axisLeft(y).ticks(5));
    g.select('.grid').transition(t).call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''));

    const labelY = spreadLabels(visible.map((u) => ({ id: u.id, y: y(u.values.at(-1)) })), 15, innerH);
    // A short curve from the line's last point to its (pushed-apart) label.
    const leader = (u) => {
      const [y0, y1] = [y(u.values.at(-1)), labelY.get(u.id)];
      return `M${innerW + 3},${y0}C${innerW + 10},${y0} ${innerW + 6},${y1} ${innerW + 14},${y1}`;
    };
    const series = g
      .select('.lines')
      .selectAll('.d3c-series')
      .data(visible, (u) => u.id) // key function: match DOM elements to units by id
      .join(
        // enter: start where you will end, then fade in (a <text> without x/y would fly in from 0,0)
        (enter) => {
          const s = enter.append('g').attr('class', 'd3c-series').style('--series', (u) => u.color).style('opacity', 0);
          s.append('path').attr('class', 'd3c-line').attr('d', (u) => line(u.values));
          s.append('path').attr('class', 'd3c-leader').attr('d', leader);
          s.append('text').attr('class', 'viz-label').attr('dy', '0.35em')
            .attr('x', innerW + 17)
            .attr('y', (u) => labelY.get(u.id));
          return s;
        },
        (update) => update,
        (exit) => exit.transition(t).style('opacity', 0).remove(),
      );
    series.transition(t).style('opacity', 1);
    series.select('.d3c-line').transition(t).attr('d', (u) => line(u.values));
    series.select('.d3c-leader')
      .attr('display', labelled ? null : 'none')
      .transition(t)
      .attr('d', leader);
    series.select('text')
      .attr('display', labelled ? null : 'none')
      .text((u) => `${u.short} ${u.values.at(-1)}`)
      .transition(t)
      .attr('x', innerW + 17)
      .attr('y', (u) => labelY.get(u.id));

    // Crosshair: snap to the nearest week, emphasise the line closest to the pointer.
    const hover = g.select('.hover').attr('display', 'none');
    const hide = () => {
      hover.attr('display', 'none');
      setEmphasis(null);
      setTip(null);
    };
    g.select('.overlay')
      .on('pointermove pointerdown', (event) => {
        const [px, py] = d3.pointer(event);
        const i = Math.max(0, Math.min(WEEKS.length - 1, Math.round(x.invert(px)) - 1));
        const nearest = d3.least(visible, (u) => Math.abs(y(u.values[i]) - py));
        setEmphasis(nearest.id);
        hover.attr('display', null).select('line').attr('x1', x(i + 1)).attr('x2', x(i + 1));
        hover.selectAll('circle').data(visible, (u) => u.id).join('circle')
          .attr('class', 'd3c-marker').attr('r', 4).style('--series', (u) => u.color)
          .attr('cx', x(i + 1)).attr('cy', (u) => y(u.values[i]));
        setTip({
          x: M.left + x(i + 1),
          y: M.top + py,
          title: `Week ${i + 1} · submissions`,
          rows: [...visible].sort((a, b) => b.values[i] - a.values[i])
            .map((u) => ({ key: 'line', color: u.color, label: u.name, value: u.values[i], active: u.id === nearest.id })),
        });
      })
      .on('pointerleave', (event) => {
        if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
      });
    const stopDismiss = onPointerDownOutside(g.node(), hide); // …until the next tap outside the chart

    return () => {
      stopDismiss();
      g.select('.overlay').on('pointermove pointerdown pointerleave', null);
      g.selectAll('*').interrupt();
    };
  }, [visible, innerW, labelled]);

  // 2. Emphasis effect – cheap: a class toggle, plus raise() to draw the line on top.
  useEffect(() => {
    const series = d3.select(gRef.current).selectAll('.d3c-series');
    series.classed('is-faded', (u) => emphasised !== null && u.id !== emphasised);
    series.filter((u) => u.id === emphasised).raise();
  }, [emphasised, visible, innerW]);

  return (
    <div>
      <ul className="viz-legend" aria-label="Units – click to show or hide">
        {units.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              aria-pressed={!hidden.has(u.id)}
              onClick={() => toggle(u.id)}
              onPointerEnter={() => !hidden.has(u.id) && setEmphasis(u.id)}
              onPointerLeave={() => setEmphasis(null)}
              onFocus={() => !hidden.has(u.id) && setEmphasis(u.id)}
              onBlur={() => setEmphasis(null)}
            >
              <span className="viz-key-line" style={{ background: u.color }} aria-hidden="true" />
              {u.name}
            </button>
          </li>
        ))}
      </ul>
      <div className="viz" ref={wrapRef}>
        <svg width={width} height={H} role="group" aria-label={SUMMARY}>
          <g ref={gRef} transform={`translate(${M.left},${M.top})`}>
            <g className="viz-grid grid" />
            <g className="viz-axis x-axis" transform={`translate(0,${innerH})`} />
            <g className="viz-axis y-axis" />
            <text className="viz-axis-title" x={innerW / 2} y={innerH + 34} textAnchor="middle">Teaching week (W7 = mid-semester break)</text>
            <g className="lines" />
            <g className="hover" pointerEvents="none">
              <line className="d3c-crosshair" y2={innerH} />
            </g>
            <rect className="overlay d3c-overlay d3c-scrub" width={innerW} height={innerH} />
          </g>
        </svg>
        <ChartTooltip tip={tip} />
      </div>
      <DataTable
        columns={['Week', ...units.map((u) => u.short)]}
        rows={WEEKS.map((w, i) => [`W${w}`, ...units.map((u) => u.values[i])])}
      />
    </div>
  );
}
