/**
 * ShapWaterfall – "why did the model say THIS URL is phishing?"
 *
 * Start at the base rate, add each feature's contribution, end at the model's
 * prediction. Red steps push towards phishing, blue steps towards legitimate.
 *
 * Pattern: D3 owns the <g>
 * Rows are keyed by feature name, so when you pick another URL, D3 slides
 * each feature's bar to its new place; features that drop out of the top 6
 * fade out (exit), newcomers fade in (enter).
 * Rows are focusable: hover, Tab or TAP a row to see its numbers.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { EXAMPLES, waterfallRows } from './data/explanations.js';
import { fitText, horizontalBarPath, motion, pct, textWidth } from './helpers/chart.js';

const ROW = 30;
const signed = d3.format('+.2f');
// Every label of every example – the label column is sized for the longest one, so it doesn't jump.
const ALL_LABELS = EXAMPLES.flatMap((e) => waterfallRows(e).map((d) => d.label));
// "domain_age_days = 4380" → keep " = 4380" if the name has to be shortened
const valuePart = (label) => (label.includes(' = ') ? label.slice(label.indexOf(' = ')) : '');
// The same colours as the bars' CSS classes – for the tooltip's key swatch.
const barColor = (d) => (d.kind === 'total' ? 'var(--color-text-subtle)' : d.contribution >= 0 ? 'var(--div-pos)' : 'var(--div-neg)');

export default function ShapWaterfall() {
  const [ref, { width }] = useElementSize();
  const gRef = useRef(null);
  const [exampleId, setExampleId] = useState('bank');
  const [hoverId, setHoverId] = useState(null); // id of the hovered / focused / tapped row
  const example = EXAMPLES.find((e) => e.id === exampleId);
  const rows = useMemo(() => waterfallRows(example), [example]);
  const prediction = rows.at(-1).end;
  const hover = rows.find((d) => d.id === hoverId); // undefined once that feature leaves the top 6

  // The label column is MEASURED (the longest label in the real font) instead of guessed – but it
  // never takes more than half the chart. On a narrow phone, longer names get an "…" (see below).
  const labelWidth = useMemo(() => d3.max(ALL_LABELS, (s) => textWidth(s)), []);
  const M = {
    top: 26, right: width < 480 ? 42 : 52, bottom: 30,
    left: Math.min(Math.ceil(labelWidth) + 16, Math.round(width / 2)),
  };
  const height = M.top + rows.length * ROW + M.bottom;
  // Domain: 0 → just past the largest running total (but always showing the 0.5 threshold),
  // so a 3% prediction is not squeezed into the left sixth of the chart. The axis transitions.
  const xMax = Math.min(1, Math.max(0.55, d3.max(rows, (d) => Math.max(d.start, d.end)) * 1.1));
  const x = useMemo(() => d3.scaleLinear([0, xMax], [M.left, width - M.right]), [xMax, M.left, M.right, width]);
  const y = useMemo(() => d3.scaleBand(rows.map((d) => d.id), [M.top, M.top + rows.length * ROW]).padding(0.25), [rows, M.top]);

  useEffect(() => {
    if (width === 0) return undefined;
    const g = d3.select(gRef.current);
    const t = d3.transition().duration(motion(800)).ease(d3.easeCubicInOut);
    const barH = Math.min(24, y.bandwidth());

    g.selectAll('g.x-axis').data([null]).join('g').attr('class', 'viz-axis viz-grid x-axis')
      .attr('transform', `translate(0,${height - M.bottom})`)
      .transition(t)
      .call(d3.axisBottom(x).ticks(width < 480 ? 3 : 10, '.0%').tickSize(-(height - M.top - M.bottom)).tickSizeOuter(0));
    // The 0.5 line: created in place (enter), then slides whenever the domain changes.
    g.selectAll('line.d3ml-reference').data([null])
      .join((enter) => enter.append('line').attr('class', 'd3ml-reference').attr('x1', x(0.5)).attr('x2', x(0.5)))
      .attr('y1', M.top - 6).attr('y2', height - M.bottom)
      .transition(t).attr('x1', x(0.5)).attr('x2', x(0.5));
    g.selectAll('text.d3ml-threshold-label').data([null])
      .join((enter) => enter.append('text').attr('class', 'viz-label-muted d3ml-threshold-label').attr('x', x(0.5)))
      .attr('y', M.top - 10).attr('text-anchor', 'middle').text('threshold 0.5')
      .transition(t).attr('x', x(0.5));

    // Hairline connectors: the end of one bar is the start of the next.
    g.selectAll('line.d3ml-connector')
      .data(rows.slice(0, -1).map((d, i) => ({ id: d.id, at: d.end, y1: y(d.id) + y.bandwidth(), y2: y(rows[i + 1].id) })), (d) => d.id)
      .join((enter) => enter.append('line').attr('class', 'd3ml-connector').style('opacity', 0))
      .transition(t).style('opacity', 1)
      .attr('x1', (d) => x(d.at)).attr('x2', (d) => x(d.at)).attr('y1', (d) => d.y1).attr('y2', (d) => d.y2);

    const bar = (d) => horizontalBarPath((y.bandwidth() - barH) / 2, barH, x(d.start), x(d.end));
    const rowsSel = g.selectAll('g.d3ml-wf-row')
      .data(rows, (d) => d.id) // KEY: the feature name
      .join(
        (enter) => {
          const row = enter.append('g').attr('class', 'd3ml-wf-row').attr('tabindex', 0)
            .attr('transform', (d) => `translate(0,${y(d.id)})`).style('opacity', 0);
          row.append('rect').attr('class', 'd3ml-wf-hit'); // the whole row is the hit target (≥ 24px tall)
          row.append('text').attr('class', 'viz-label d3ml-wf-name').attr('text-anchor', 'end').attr('dy', '0.35em');
          row.append('path').attr('class', 'd3ml-wf-bar').attr('d', (d) => horizontalBarPath((y.bandwidth() - barH) / 2, barH, x(d.start), x(d.start)));
          // d3ml-halo: a surface-coloured outline, so the 0.5 threshold line never cuts through a value
          row.append('text').attr('class', 'viz-label-muted d3ml-wf-value d3ml-halo').attr('dy', '0.35em').attr('x', (d) => x(d.start));
          return row;
        },
        (update) => update,
        (exit) => exit.transition(t).style('opacity', 0).remove(),
      )
      .attr('aria-label', (d) => (d.kind === 'total' ? `${d.label}: ${pct(d.end)}`
        : `${d.label}: ${signed(d.contribution)}, from ${pct(d.start)} to ${pct(d.end)}`))
      // Mouse: hover. Touch: a tap FOCUSES the row, and a finger "leaves" as soon as it lifts – so only
      // a mouse leaving clears the tooltip; after a tap it stays until the next tap elsewhere (blur).
      .on('pointerenter focus click', (event, d) => setHoverId(d.id))
      .on('pointerleave', (event) => event.pointerType !== 'touch' && setHoverId(null))
      .on('blur', () => setHoverId(null));

    rowsSel.transition(t).style('opacity', 1).attr('transform', (d) => `translate(0,${y(d.id)})`);
    rowsSel.select('.d3ml-wf-hit').attr('x', 0).attr('width', width)
      .attr('y', (y.bandwidth() - y.step()) / 2).attr('height', y.step());
    rowsSel.select('.d3ml-wf-name').attr('x', M.left - 10).attr('y', y.bandwidth() / 2)
      .text((d) => fitText(d.label, M.left - 14, valuePart(d.label))); // the full label: aria-label + tooltip
    rowsSel.select('.d3ml-wf-bar')
      .attr('class', (d) => `d3ml-wf-bar ${d.kind === 'total' ? `is-${d.id}` : d.contribution >= 0 ? 'is-positive' : 'is-negative'}`)
      .transition(t).attr('d', bar);
    // Value label at the bar's data end – unless a leftward bar has no room before the names.
    const onLeft = (d) => d.end < d.start && x(d.end) - M.left > 44;
    rowsSel.select('.d3ml-wf-value')
      .text((d) => (d.kind === 'total' ? pct(d.end) : signed(d.contribution)))
      .attr('y', y.bandwidth() / 2)
      .attr('text-anchor', (d) => (onLeft(d) ? 'end' : 'start'))
      .transition(t).attr('x', (d) => (onLeft(d) ? x(d.end) - 6 : Math.max(x(d.start), x(d.end)) + 6));

    return () => g.selectAll('*').interrupt();
  }, [rows, x, y, width, height, M.left, M.top, M.bottom]);

  // Highlight the active row with a class – CSS does the styling. (width: the <svg> re-mounts after the Code tab.)
  useEffect(() => {
    d3.select(gRef.current).selectAll('g.d3ml-wf-row').classed('is-active', (d) => d.id === hoverId);
  }, [hoverId, rows, width]);

  const isPhishing = prediction >= 0.5;
  const tipAbove = hover && y(hover.id) > height / 2; // tooltip under the row (over it for the lower rows)
  const Icon = isPhishing ? ShieldAlert : ShieldCheck;
  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Example URL">
          {EXAMPLES.map((e) => (
            <button key={e.id} type="button" className={`btn btn-sm ${e.id === exampleId ? 'active' : ''}`}
              aria-pressed={e.id === exampleId} onClick={() => setExampleId(e.id)}>{e.label}</button>
          ))}
        </div>
      </div>
      <div className="d3ml-prediction">
        <code className="d3ml-url">{example.url}</code>
        <span className={`badge ${isPhishing ? 'badge-danger' : 'badge-success'}`}>
          <Icon size={14} aria-hidden="true" /> {isPhishing ? 'Phishing' : 'Legitimate'} · {pct(prediction)}
        </span>
      </div>
      <ul className="viz-legend">
        <li><span className="viz-swatch" style={{ background: 'var(--div-pos)' }} /> pushes towards phishing</li>
        <li><span className="viz-swatch" style={{ background: 'var(--div-neg)' }} /> pushes towards legitimate</li>
        <li><span className="viz-swatch" style={{ background: 'var(--color-text-subtle)' }} /> base rate / prediction</li>
      </ul>
      <div className="viz" ref={ref}>
        {width > 0 && (
          // role="group", not "img": "img" would hide the focusable rows from assistive tech
          <svg width={width} height={height} role="group"
            aria-label={`Waterfall for ${example.url}: base rate ${pct(rows[0].end)}, ${rows.slice(1, -1).map((d) => `${d.label} ${signed(d.contribution)}`).join(', ')}, prediction ${pct(prediction)}.`}>
            <g ref={gRef} />
          </svg>
        )}
        {hover && (
          // Under / over the row – never on top of it, so the row's label stays readable.
          <ChartTooltip x={x(hover.end)} width={width} title={hover.label} placement={tipAbove ? 'above' : 'below'}
            y={tipAbove ? y(hover.id) - 2 : y(hover.id) + y.bandwidth() + 2}>
            {hover.kind === 'total' ? (
              <TooltipRow color={barColor(hover)} label="Probability of phishing" value={pct(hover.end)} />
            ) : (
              <>
                <TooltipRow color={barColor(hover)} label="Contribution" value={signed(hover.contribution)} />
                <TooltipRow color="transparent" label="Running total" value={`${pct(hover.start)} → ${pct(hover.end)}`} />
              </>
            )}
          </ChartTooltip>
        )}
      </div>

      <details className="d3ml-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th scope="col">Step</th><th scope="col" className="num">Contribution</th><th scope="col" className="num">Running total</th></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <th scope="row" className="mono small">{d.label}</th>
                  <td className="num">{d.kind === 'total' ? '–' : signed(d.contribution)}</td>
                  <td className="num">{pct(d.end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
