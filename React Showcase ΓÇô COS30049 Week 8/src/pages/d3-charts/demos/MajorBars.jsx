/**
 * MajorBars – students per major. Click a bar (or focus it and press Enter) to filter.
 * Pattern: D3 owns the <g>. The chart keeps NO state of its own: it receives `data` and
 * the `selected` major from its parent and reports clicks through `onToggle`.
 * D3 event handlers are closures created inside the effect, so they read the latest
 * onToggle through a ref instead of capturing an old one.
 */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import { barPath, motion } from './helpers/chartKit.js';

const ROW = 40; // ≥ 24px hit target per bar
const BAR = 16;
const M = { top: 2, right: 36, bottom: 2, left: 0 };

export default function MajorBars({ data, selected, onToggle }) {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const onToggleRef = useRef(onToggle);
  useEffect(() => {
    onToggleRef.current = onToggle; // always the latest callback
  });
  const height = M.top + data.length * ROW + M.bottom;

  useEffect(() => {
    if (width === 0) return undefined;
    const innerW = width - M.left - M.right;
    const g = d3.select(gRef.current);
    const x = d3.scaleLinear([0, d3.max(data, (d) => d.count) || 1], [0, innerW]);
    const t = g.transition().duration(motion(500)).ease(d3.easeCubicOut);

    const rows = g.selectAll('g.row').data(data, (d) => d.major).join((enter) => {
      const row = enter.append('g').attr('class', 'row d3c-clickable').attr('tabindex', 0).attr('role', 'button')
        .attr('transform', (d, i) => `translate(0,${i * ROW})`);
      row.append('rect').attr('class', 'd3c-overlay').attr('height', ROW - 2); // the whole row is clickable
      row.append('text').attr('class', 'viz-label').attr('y', 11).text((d) => d.major);
      row.append('path').attr('class', 'd3c-bar').attr('transform', 'translate(0,17)');
      row.append('text').attr('class', 'viz-label d3c-value').attr('y', 17 + BAR / 2).attr('dy', '0.35em');
      return row;
    });

    const toggle = (event, d) => onToggleRef.current(d.major);
    rows
      .attr('aria-pressed', (d) => d.major === selected)
      .attr('aria-label', (d) => `${d.major}: ${d.count} students`)
      .on('click', toggle)
      .on('keydown', (event, d) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle(event, d);
      });
    rows.select('rect').attr('width', width);
    rows.select('.d3c-bar')
      .classed('is-faded', (d) => selected !== 'All' && d.major !== selected) // the others step back
      .transition(t).attr('d', (d) => barPath(0, 0, x(d.count), BAR));
    rows.select('.d3c-value').transition(t)
      .attr('x', (d) => x(d.count) + 6)
      .textTween(function (d) {
        const count = d3.interpolateRound(this.previous ?? 0, d.count);
        return (k) => {
          this.previous = count(k); // the number on screen – an interrupted count continues from it
          return this.previous;
        };
      });

    return () => {
      rows.on('click keydown', null);
      g.selectAll('*').interrupt();
    };
  }, [data, selected, width]);

  return (
    <div className="viz" ref={wrapRef}>
      <svg width={width} height={height} role="group" aria-label="Students per major. Each bar is a button that filters the dashboard.">
        <g ref={gRef} transform={`translate(${M.left},${M.top})`} />
      </svg>
    </div>
  );
}
