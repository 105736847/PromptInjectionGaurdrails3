/**
 * FeatureImportance – sorted horizontal bars that RE-SORT with a keyed transition.
 *
 * Pattern: D3 owns the <g>
 * The key function (d => d.feature) is the star: when you switch model, D3
 * matches each bar to the SAME feature and slides it to its new rank instead
 * of repainting bars by position. Logistic regression coefficients have a
 * sign, so they become diverging bars around zero. Every row is focusable:
 * hover, Tab to or tap a bar for its numbers – the table lists them all.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { MODELS } from './data/featureImportance.js';
import { horizontalBarPath, inkOn, motion } from './helpers/chart.js';

const M = { top: 8, right: 16, bottom: 30, left: 132 };
const ROW = 30; // px per feature row
const formatFor = (signed) => d3.format(signed ? '+.2f' : '.1~%');
// Neutral grey = a size without a direction; red / blue = pushes towards phishing / legitimate.
const barColor = (d, signed) => (!signed ? 'var(--color-text-subtle)' : d.value > 0 ? 'var(--div-pos)' : 'var(--div-neg)');

export default function FeatureImportance() {
  const colors = useChartTheme(); // real colour values – for the text inside a bar
  const [ref, { width }] = useElementSize();
  const gRef = useRef(null);
  const [modelId, setModelId] = useState('rf');
  const [hoverId, setHoverId] = useState(null); // feature under the pointer / keyboard focus
  const model = MODELS.find((m) => m.id === modelId);
  const signed = model.kind === 'coefficient';
  const fmt = formatFor(signed);

  // Sort by magnitude, so the strongest effect is always on top.
  const rows = useMemo(() => Object.entries(model.values)
    .map(([feature, value]) => ({ feature, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)), [model]);
  const height = M.top + rows.length * ROW + M.bottom;
  // Scales are calculated during render: D3 draws with them, React places the tooltip with them.
  const x = useMemo(() => {
    const max = d3.max(rows, (d) => Math.abs(d.value)) * 1.22; // headroom for value labels
    return d3.scaleLinear(signed ? [-max, max] : [0, max], [M.left, width - M.right]);
  }, [rows, signed, width]);
  const y = useMemo(() => d3.scaleBand(rows.map((d) => d.feature), [M.top, M.top + rows.length * ROW]).padding(0.3), [rows]);

  useEffect(() => {
    if (width === 0) return undefined;
    const g = d3.select(gRef.current);
    const barH = Math.min(24, y.bandwidth());
    const format = formatFor(signed);
    const t = d3.transition().duration(motion(750)).ease(d3.easeCubicInOut);

    g.selectAll('g.x-axis').data([null]).join('g').attr('class', 'viz-axis viz-grid x-axis')
      .attr('transform', `translate(0,${height - M.bottom})`)
      .transition(t)
      .call(d3.axisBottom(x).ticks(Math.max(2, (width - M.left) / 90), signed ? '+.1f' : '.0%')
        .tickSize(-(rows.length * ROW)).tickSizeOuter(0));

    // One <g> per feature. KEY = feature name → bars keep their identity.
    const bars = g.selectAll('g.d3ml-fi-row')
      .data(rows, (d) => d.feature)
      .join((enter) => {
        const row = enter.append('g').attr('class', 'd3ml-fi-row').attr('tabindex', 0)
          .attr('transform', (d) => `translate(0,${y(d.feature)})`);
        row.append('rect').attr('class', 'd3ml-fi-hit'); // the whole row is the hit target (≥ 24px tall)
        row.append('text').attr('class', 'viz-label d3ml-fi-name').attr('text-anchor', 'end').attr('dy', '0.35em');
        row.append('path').attr('class', 'd3ml-fi-bar').attr('d', horizontalBarPath(0, barH, x(0), x(0)));
        row.append('text').attr('class', 'viz-label-muted d3ml-fi-value').attr('dy', '0.35em').attr('x', x(0)); // grows with the bar
        return row;
      })
      .attr('aria-label', (d, i) => `${d.feature}: ${signed ? 'coefficient' : 'importance'} ${format(d.value)}, rank ${i + 1} of ${rows.length}`)
      // Mouse: hover. Touch: a tap FOCUSES the row, and a finger "leaves" as soon as it lifts – so only
      // a mouse leaving clears the tooltip; after a tap it stays until the next tap elsewhere (blur).
      .on('pointerenter focus click', (event, d) => setHoverId(d.feature))
      .on('pointerleave', (event) => event.pointerType !== 'touch' && setHoverId(null))
      .on('blur', () => setHoverId(null));

    // .delay by rank = a staggered "ripple" as the rows re-sort.
    bars.transition(t).delay((d, i) => motion(i * 35))
      .attr('transform', (d) => `translate(0,${y(d.feature)})`);
    bars.select('.d3ml-fi-hit').attr('x', 0).attr('width', width)
      .attr('y', (y.bandwidth() - y.step()) / 2).attr('height', y.step());
    bars.select('.d3ml-fi-name').attr('x', M.left - 10).attr('y', y.bandwidth() / 2).text((d) => d.feature);
    bars.select('.d3ml-fi-bar')
      .classed('is-positive', (d) => signed && d.value > 0)
      .classed('is-negative', (d) => signed && d.value < 0)
      .transition(t)
      .attr('d', (d) => horizontalBarPath((y.bandwidth() - barH) / 2, barH, x(0), x(d.value)));
    // Value labels sit just past the bar's end – or INSIDE it when there is no room
    // (on a phone, −1.85 would otherwise run into the feature name and lose its sign).
    const room = (d) => (d.value < 0 ? x(d.value) - M.left : width - x(d.value));
    const inside = (d) => signed && room(d) < 40;
    const toLeft = (d) => (d.value < 0) !== inside(d); // outside a negative bar, or inside a positive one
    bars.select('.d3ml-fi-value')
      .text((d) => format(d.value))
      .attr('text-anchor', (d) => (toLeft(d) ? 'end' : 'start'))
      // Inside a coloured bar, pick dark or white ink by the fill's lightness (null = use the CSS colour).
      .style('fill', (d) => (inside(d) ? inkOn(colors.diverging[d.value > 0 ? 2 : 0]) : null))
      .attr('y', y.bandwidth() / 2)
      .transition(t)
      .attr('x', (d) => x(d.value) + (toLeft(d) ? -6 : 6));

    // A zero line matters for diverging bars. Created in place (enter), so it never slides in from x = 0.
    g.selectAll('line.d3ml-zero').data([null])
      .join((enter) => enter.append('line').attr('class', 'd3ml-baseline d3ml-zero')
        .attr('x1', x(0)).attr('x2', x(0)).attr('y1', M.top).attr('y2', height - M.bottom))
      .transition(t).attr('x1', x(0)).attr('x2', x(0)).attr('y1', M.top).attr('y2', height - M.bottom);

    return () => g.selectAll('*').interrupt();
  }, [rows, signed, height, width, colors, x, y]);

  // Highlight the active row with a class – CSS does the styling. (width: the <svg> re-mounts after the Code tab.)
  useEffect(() => {
    d3.select(gRef.current).selectAll('g.d3ml-fi-row').classed('is-active', (d) => d.feature === hoverId);
  }, [hoverId, rows, width]);

  const hover = rows.find((d) => d.feature === hoverId);
  const tipAbove = hover && y(hover.feature) > height / 2; // under the row (over it for the lower rows)
  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Model">
          {MODELS.map((m) => (
            <button key={m.id} type="button" className={`btn btn-sm ${m.id === modelId ? 'active' : ''}`}
              aria-pressed={m.id === modelId} onClick={() => setModelId(m.id)}>{m.label}</button>
          ))}
        </div>
      </div>
      <ul className="viz-legend">
        {signed ? (
          <>
            <li><span className="viz-swatch" style={{ background: 'var(--div-pos)' }} /> pushes towards phishing (+)</li>
            <li><span className="viz-swatch" style={{ background: 'var(--div-neg)' }} /> pushes towards legitimate (−)</li>
          </>
        ) : (
          <li><span className="viz-swatch" style={{ background: 'var(--color-text-subtle)' }} /> importance: how much, not which direction</li>
        )}
      </ul>
      <div className="viz" ref={ref}>
        {width > 0 && (
          // role="group", not "img": "img" would hide the focusable rows from assistive tech
          <svg width={width} height={height} role="group"
            aria-label={`${model.label} feature ${signed ? 'coefficients' : 'importances'}. Tab to a bar for its value.`}>
            <g ref={gRef} />
          </svg>
        )}
        {hover && (
          <ChartTooltip x={x(hover.value)} width={width} title={hover.feature} placement={tipAbove ? 'above' : 'below'}
            y={tipAbove ? y(hover.feature) - 2 : y(hover.feature) + y.bandwidth() + 2}>
            <TooltipRow color={barColor(hover, signed)} label={signed ? 'Coefficient' : 'Importance'} value={fmt(hover.value)} />
            {signed
              ? <TooltipRow color="transparent" label="Pushes towards" value={hover.value > 0 ? 'phishing' : 'legitimate'} />
              : <TooltipRow color="transparent" label="Rank" value={`${rows.indexOf(hover) + 1} of ${rows.length}`} />}
          </ChartTooltip>
        )}
      </div>
      <p className="small muted m-0"><code>{model.id === 'lr' ? 'model.coef_[0]' : 'model.feature_importances_'}</code> – {model.note}</p>

      <details className="d3ml-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption className="small muted">All three models, sorted by {model.label}</caption>
            <thead>
              <tr><th scope="col">Feature</th>{MODELS.map((m) => <th key={m.id} scope="col" className="num">{m.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature}>
                  <th scope="row" className="mono small">{r.feature}</th>
                  {MODELS.map((m) => <td key={m.id} className="num">{formatFor(m.kind === 'coefficient')(m.values[r.feature])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
