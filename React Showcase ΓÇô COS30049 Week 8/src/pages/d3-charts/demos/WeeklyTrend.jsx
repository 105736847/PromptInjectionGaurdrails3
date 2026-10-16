/**
 * WeeklyTrend – average study hours per teaching week: the filtered students vs everyone.
 * Pattern: D3 owns the <g>. Props in, transitions out: when the parent's filters change,
 * `selection` changes, the line morphs to its new shape and the y-axis rescales.
 * `selection` is null when no filter is active (or no student matches): its line then melts
 * back into the grey "all students" line – and peels out of it again when a filter returns.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { motion } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';

const M = { top: 22, right: 12, bottom: 28, left: 32 };
const H = 232;
const innerH = H - M.top - M.bottom;
const SERIES = [
  { key: 'overall', label: 'All students', color: 'var(--color-text-subtle)' },
  { key: 'selection', label: 'Selected students', color: 'var(--chart-1)' },
];

export default function WeeklyTrend({ selection, overall }) {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const [tip, setTip] = useState(null);
  const innerW = Math.max(0, width - M.left - M.right);
  const drawn = SERIES.filter((s) => s.key === 'overall' || selection); // the legend lists only drawn lines

  useEffect(() => {
    if (innerW === 0) return undefined;
    const g = d3.select(gRef.current);
    const lines = [{ ...SERIES[0], values: overall }, ...(selection ? [{ ...SERIES[1], values: selection }] : [])];
    const x = d3.scaleLinear([1, overall.length], [0, innerW]);
    const y = d3.scaleLinear([0, d3.max(lines, (l) => d3.max(l.values))], [innerH, 0]).nice();
    const line = d3.line().x((v, i) => x(i + 1)).y((v) => y(v)).curve(d3.curveMonotoneX);
    const t = g.transition().duration(motion(600));

    g.select('.x-axis').call(d3.axisBottom(x).tickValues(innerW < 300 ? [2, 4, 6, 8, 10, 12] : d3.range(1, 13)).tickSizeOuter(0));
    g.select('.y-axis').transition(t).call(d3.axisLeft(y).ticks(4));
    g.select('.grid').transition(t).call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(''));

    g.select('.lines').selectAll('path').data(lines, (l) => l.key)
      .join(
        // enter + exit use the "all students" shape, so the selection peels out of it and melts back in
        (enter) => enter.append('path').attr('class', 'd3c-line').style('--series', (l) => l.color)
          .attr('d', line(overall)).style('opacity', 0),
        (update) => update,
        (exit) => exit.transition(t).attr('d', line(overall)).style('opacity', 0).remove(),
      )
      .transition(t).style('opacity', 1).attr('d', (l) => line(l.values));

    // Crosshair tooltip listing both lines.
    const hover = g.select('.hover').attr('display', 'none');
    const hide = () => {
      hover.attr('display', 'none');
      setTip(null);
    };
    g.select('.overlay')
      .on('pointermove pointerdown', (event) => {
        const i = Math.max(0, Math.min(overall.length - 1, Math.round(x.invert(d3.pointer(event)[0])) - 1));
        hover.attr('display', null).attr('transform', `translate(${x(i + 1)},0)`);
        setTip({
          x: M.left + x(i + 1),
          y: M.top + innerH / 2,
          title: `Week ${i + 1}`,
          rows: [...lines].reverse().map((l) => ({ key: 'line', color: l.color, label: l.label, value: `${l.values[i].toFixed(1)} h` })),
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
  }, [selection, overall, innerW]);

  return (
    <div>
      <ul className="viz-legend" aria-label="Legend">
        {drawn.map((s) => (
          <li key={s.key}>
            <span className="viz-key-line" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>
      <div className="viz" ref={wrapRef}>
        <svg width={width} height={H} role="group" aria-label="Line chart of average study hours per teaching week for the selected students compared with all students.">
          <g ref={gRef} transform={`translate(${M.left},${M.top})`}>
            <text className="viz-axis-title" x={-M.left} y={-10}>Hours</text>
            <g className="viz-grid grid" />
            <g className="viz-axis x-axis" transform={`translate(0,${innerH})`} />
            <g className="viz-axis y-axis" />
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
        columns={['Week', 'All students (h)', 'Selected (h)']}
        rows={overall.map((v, i) => [`Week ${i + 1}`, v.toFixed(1), selection ? selection[i].toFixed(1) : '–'])}
      />
    </div>
  );
}
