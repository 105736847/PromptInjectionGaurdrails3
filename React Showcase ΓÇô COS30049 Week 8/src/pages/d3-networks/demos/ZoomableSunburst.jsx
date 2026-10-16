/**
 * ZoomableSunburst – enrolments as nested rings: faculty → school → degree → major.
 * Click a ring to zoom into it, click the centre (or the breadcrumb) to go back.
 *
 * Pattern: D3 owns the <g>
 * D3 owns the arcs and their labels; React owns the focus state, the breadcrumb
 * and the centre label. d3.partition() lays the tree out in "angle × depth"
 * space; d3.arc() turns that into ring segments. To zoom we compute a TARGET
 * angle/depth for every node and let a transition tween each node's `current`
 * value towards it (an "arc tween").
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ChevronRight } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import useChartTheme from '../../../hooks/useChartTheme.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import textOn from './helpers/textOn.js';
import { motion } from './helpers/motion.js';
import { enrolments } from './data/enrolments.js';

const format = d3.format(',');
const visible = (d) => d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0; // only the two rings around the centre
const opacityOf = (d) => (d.children ? 0.9 : 0.6);

export default function ZoomableSunburst() {
  const [wrapRef, { width }] = useElementSize();
  const colors = useChartTheme();
  const gRef = useRef(null);
  const [root] = useState(() => {
    const h = d3.hierarchy(enrolments).sum((d) => d.value ?? 0).sort((a, b) => b.value - a.value);
    const r = d3.partition().size([2 * Math.PI, h.height + 1])(h); // x = angle, y = depth ring
    r.each((d) => { d.current = d; d.key = d.ancestors().map((a) => a.data.name).join('/'); });
    return r;
  });
  const [focus, setFocus] = useState(root);
  const [hover, setHover] = useState(null);
  const size = Math.min(width, 640);
  const radius = size / 6; // centre + 2 visible rings = 3 × radius

  useEffect(() => {
    if (size === 0) return undefined;
    const g = d3.select(gRef.current);
    const slot = (d) => root.children.indexOf(d.ancestors().at(-2)) + 1; // colour = faculty
    // Text colour: blend the fill over the surface (it is semi-transparent), then pick white or ink.
    const ink = (d, alpha = opacityOf(d)) => textOn(d3.interpolateRgb(colors.surface, colors.categorical[slot(d) - 1])(alpha));
    const arc = d3.arc().startAngle((d) => d.x0).endAngle((d) => d.x1)
      .innerRadius((d) => d.y0 * radius).outerRadius((d) => d.y1 * radius);
    const mid = (d) => ({ angle: ((d.x0 + d.x1) / 2) * (180 / Math.PI), r: ((d.y0 + d.y1) / 2) * radius });
    const labelFits = (d) => visible(d) && (d.x1 - d.x0) * mid(d).r > 13; // arc length at mid-radius ≥ text height
    const labelTransform = (d) => {
      const { angle, r } = mid(d);
      return `rotate(${angle - 90}) translate(${r},0) rotate(${angle < 180 ? 0 : 180})`;
    };
    const maxChars = Math.floor((radius - 12) / 5.4); // ≈ characters that fit across one ring at 10px
    // The full name if it fits ("School of Computing" → "Computing"), else the data's short
    // name, else no label at all – a cut-off "Busine…" is not a word. The tooltip has the rest.
    const labelOf = (d) => [d.data.name.replace(/^(School|Bachelor) of /, ''), d.data.short]
      .find((text) => text && text.length <= maxChars) ?? '';

    // Where every node should end up when `focus` fills the circle.
    root.each((d) => {
      d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - focus.x0) / (focus.x1 - focus.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - focus.x0) / (focus.x1 - focus.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - focus.depth),
        y1: Math.max(0, d.y1 - focus.depth),
      };
    });

    const nodes = root.descendants().slice(1);
    const path = g.selectAll('path').data(nodes, (d) => d.key)
      .join((enter) => enter.append('path').style('opacity', (d) => +visible(d.current)))
      .style('fill', (d) => `var(--chart-${slot(d)})`).style('fill-opacity', opacityOf)
      .style('stroke', 'var(--color-surface)').style('stroke-width', 2) // 2px gap between arcs
      .attr('d', (d) => arc(d.current));
    const label = g.selectAll('text').data(nodes, (d) => d.key)
      .join((enter) => enter.append('text').style('opacity', (d) => +labelFits(d.current)))
      .attr('dy', '0.35em').attr('text-anchor', 'middle').style('font-size', '10px').style('pointer-events', 'none')
      .style('fill', (d) => ink(d)).text(labelOf)
      .attr('transform', (d) => labelTransform(d.current));

    // The arc tween: interpolate each node's angles/depths, redraw the arc every frame.
    const t = g.transition().duration(motion(750));
    path.transition(t)
      .tween('data', (d) => { const i = d3.interpolate(d.current, d.target); return (k) => { d.current = i(k); }; })
      .style('opacity', (d) => +visible(d.target)) // hidden rings fade out completely
      .attrTween('d', (d) => () => arc(d.current));
    path.style('pointer-events', (d) => (visible(d.target) ? 'auto' : 'none'))
      .attr('tabindex', (d) => (visible(d.target) && d.children ? 0 : null))
      .attr('role', (d) => (d.children ? 'button' : null))
      .attr('aria-label', (d) => `${d.data.name}: ${format(d.value)} students${d.children ? ' – press Enter to zoom in' : ''}`)
      .style('cursor', (d) => (d.children ? 'zoom-in' : 'default'));
    label.transition(t)
      .style('opacity', (d) => +labelFits(d.target))
      .attrTween('transform', (d) => () => labelTransform(d.current));

    // Hover: the arc and everything inside it (what a click zooms into) stay bright, the rest fades.
    let lit = null; // only repaint when the hovered arc changes, not on every pointermove
    const highlight = (d) => {
      if (d === lit) return;
      lit = d;
      const alpha = (p) => (!d || p.ancestors().includes(d) ? opacityOf(p) : opacityOf(p) * 0.4);
      path.style('fill-opacity', alpha);
      label.style('fill', (p) => ink(p, alpha(p))); // a lighter/darker fill may need the other text colour
    };
    const zoom = (d) => { if (d.children) { setHover(null); setFocus(d); } };
    path.on('click', (event, d) => zoom(d))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); zoom(d); } // like a real <button>
      })
      .on('pointermove focus', (event, d) => {
        highlight(d);
        // Keyboard focus has no pointer → show the tooltip above the centre instead.
        const [x, y] = event.type === 'focus' ? [width / 2, size / 2 - radius] : d3.pointer(event, gRef.current.ownerSVGElement);
        setHover({ d, x, y });
      })
      .on('pointerleave blur', () => { highlight(null); setHover(null); });

    return () => {
      g.interrupt();
      path.interrupt().on('click keydown pointermove focus pointerleave blur', null);
      label.interrupt();
    };
  }, [root, focus, radius, size, width, colors]);

  const trail = focus.ancestors().reverse();
  const centreLines = useMemo(() => {
    const words = focus.data.name.split(' ');
    const lines = [''];
    for (const w of words) { // greedy word-wrap into lines of ≈ 16 characters
      if ((lines.at(-1) + ' ' + w).trim().length > 16 && lines.at(-1)) lines.push(w);
      else lines[lines.length - 1] = `${lines.at(-1)} ${w}`.trim();
    }
    return lines.slice(0, 3);
  }, [focus]);

  return (
    <figure className="m-0">
      <nav className="viz-controls" aria-label="Sunburst breadcrumb">
        <ol className="d3-networks-crumbs">
          {trail.map((a, i) => (
            <li key={a.data.name}>
              {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
              {a === focus ? <span aria-current="page">{a.data.name}</span>
                : <button type="button" onClick={() => setFocus(a)}>{a.data.name}</button>}
            </li>
          ))}
        </ol>
      </nav>
      <ul className="viz-legend">
        {root.children.map((f, i) => <li key={f.data.name}><span className="viz-swatch" style={{ background: `var(--chart-${i + 1})` }} />{f.data.name}</li>)}
      </ul>
      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": an img would hide the focusable arcs from screen readers.
            overflow: hidden – while zooming, the rings that grow or fade out reach past the circle. */}
        <svg width={width} height={size} role="group" aria-label={`Sunburst of enrolments, zoomed into ${focus.data.name}.`}
          style={{ overflow: 'hidden' }}>
          <g transform={`translate(${width / 2},${size / 2})`}>
            <g ref={gRef} />
            {/* React owns the centre: click it to zoom out */}
            <circle r={radius} style={{ fill: 'var(--color-surface)', cursor: focus.parent ? 'zoom-out' : 'default' }}
              onClick={() => focus.parent && setFocus(focus.parent)} />
            <text textAnchor="middle" className="viz-label" style={{ pointerEvents: 'none' }}>
              {centreLines.map((line, i) => (
                <tspan key={line} x={0} y={(i - centreLines.length / 2) * 15 - 4} style={{ fontWeight: 600, fontSize: 12 }}>{line}</tspan>
              ))}
              <tspan x={0} y={centreLines.length * 7.5 + 12} className="viz-label-muted">{format(focus.value)} students</tspan>
            </text>
          </g>
        </svg>
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            <div className="viz-tooltip-title">{hover.d.data.name}</div>
            <TooltipRow color={`var(--chart-${root.children.indexOf(hover.d.ancestors().at(-2)) + 1})`} label="Students" value={format(hover.d.value)} />
            <TooltipRow label={`Share of ${hover.d.parent.data.short ?? hover.d.parent.data.name}`} value={d3.format('.0%')(hover.d.value / hover.d.parent.value)} />
            {hover.d.children && <div className="subtle small mt-1">Click to zoom in</div>}
          </ChartTooltip>
        )}
      </div>
      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>{focus.data.name}: enrolments one level down</caption>
            <thead><tr><th scope="col">Name</th><th scope="col" className="num">Students</th><th scope="col" className="num">Share</th></tr></thead>
            <tbody>
              {(focus.children ?? []).map((c) => (
                <tr key={c.data.name}>
                  <th scope="row">{c.data.name}</th>
                  <td className="num">{format(c.value)}</td>
                  <td className="num">{d3.format('.0%')(c.value / focus.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
