/**
 * SankeyDiagram – where do students go? Entry pathway → major → outcome.
 * The width of every band is proportional to the number of students.
 *
 * Pattern: D3 calculates, React renders
 * d3-sankey (a separate package, not in the main d3 bundle) computes node
 * rectangles and link widths; sankeyLinkHorizontal() turns each link into a
 * curved path. React draws them and keeps the hovered / pinned node or link
 * in state to highlight a whole journey.
 *
 * Colour: the bands cross each other, so they are all grey. Only the flow you
 * hover, focus or click (= pin) turns --chart-1; nodes are named by direct labels.
 */
import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { PATHWAYS, MAJORS, OUTCOMES, nodes as NODES, links as LINKS } from './data/studentJourneys.js';

const STAGES = ['Entry pathway', 'Major', 'Outcome'];
const TOTAL = d3.sum(LINKS, (l) => (l.source < PATHWAYS.length ? l.value : 0)); // every student once
const percent = d3.format('.0%');

export default function SankeyDiagram() {
  const [wrapRef, { width }] = useElementSize();
  const [hover, setHover] = useState(null); // { node } or { link }, plus x, y for the tooltip
  const [pinned, setPinned] = useState(null); // { node: index } or { link: index } – survives a resize
  const compact = width < 560;
  const height = compact ? 420 : 470;
  const right = compact ? width - 62 : width; // on a phone the outcome labels move to the right of their bars

  // d3-sankey MUTATES its input, so give it fresh copies each time the size changes.
  const graph = useMemo(() => {
    if (width === 0) return null;
    return sankey().nodeWidth(14).nodePadding(compact ? 10 : 14).nodeSort(null) // null = keep our order
      .extent([[0, 22], [right, height - 4]])({ nodes: NODES.map((d) => ({ ...d })), links: LINKS.map((d) => ({ ...d })) });
  }, [width, right, height, compact]);

  // What is highlighted? What the pointer / keyboard is on, else what was clicked.
  const pin = pinned && graph && (pinned.node !== undefined ? { node: graph.nodes[pinned.node] } : { link: graph.links[pinned.link] });
  const focus = hover ?? pin;
  const lit = (l) => { // is this link part of the highlighted flow? A pathway lights up its whole journey.
    if (!focus) return false;
    if (focus.node) {
      const n = focus.node;
      return n.stage === 0 ? l.pathway === n.index : l.source === n || l.target === n;
    }
    const a = focus.link; // the link itself + the connected part of the same pathway's journey
    return l === a || (l.pathway === a.pathway && (l.source === a.target || l.target === a.source));
  };
  const litNode = (n) => Boolean(focus && (focus.node === n || focus.link?.source === n || focus.link?.target === n));
  const point = (event, extra) => {
    const [x, y] = d3.pointer(event, event.currentTarget.ownerSVGElement);
    setHover({ ...extra, x, y });
  };
  const togglePin = (key) => setPinned((p) => (p && p.node === key.node && p.link === key.link ? null : key));
  const crosstab = PATHWAYS.map((_, p) => OUTCOMES.map((__, o) => d3.sum(LINKS, (l) => (l.pathway === p && l.target === PATHWAYS.length + MAJORS.length + o ? l.value : 0))));

  return (
    <figure className="m-0">
      <div className="viz-controls">
        <button type="button" className="btn btn-sm" onClick={() => setPinned(null)} disabled={!pinned}>
          <RotateCcw size={15} aria-hidden="true" />Reset
        </button>
        <span className="subtle small">Hover a node or a band · click (or Enter) pins it</span>
      </div>
      <ul className="viz-legend">
        <li><span className="viz-swatch" style={{ background: 'var(--chart-1)' }} />Selected flow</li>
        <li><span className="viz-swatch" style={{ background: 'var(--color-text-subtle)', opacity: 0.5 }} />Other students</li>
        <li className="subtle small">Band width = number of students</li>
      </ul>
      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": an img would hide the focusable nodes from screen readers */}
        {graph && (
          <svg width={width} height={height} role="group" aria-label="Sankey diagram: entry pathway to major to outcome, band width = number of students.">
            {STAGES.map((stage, i) => (
              <text key={stage} x={[0, right / 2, width][i]} y={10} textAnchor={['start', 'middle', 'end'][i]} className="viz-axis-title">{stage}</text>
            ))}
            <g style={{ fill: 'none' }}>
              {[...graph.links].sort((a, b) => lit(a) - lit(b)).map((l) => ( // highlighted bands last = on top
                <path key={l.index} d={sankeyLinkHorizontal()(l)}
                  style={{
                    stroke: lit(l) ? 'var(--chart-1)' : 'var(--color-text-subtle)',
                    strokeWidth: Math.max(1, l.width),
                    strokeOpacity: lit(l) ? 0.7 : focus ? 0.08 : 0.3,
                    transition: 'stroke-opacity 200ms', cursor: 'pointer',
                  }}
                  onPointerMove={(e) => point(e, { link: l })} onPointerLeave={() => setHover(null)}
                  onClick={() => togglePin({ link: l.index })} />
              ))}
            </g>
            {graph.nodes.map((n) => {
              const labelLeft = n.stage === 2 && !compact; // outcome labels sit to the left of their bar
              const showValue = !compact || (n.stage < 2 && n.y1 - n.y0 > 26);
              return (
                <g key={n.index} tabIndex={0} role="button" aria-pressed={pinned?.node === n.index}
                  aria-label={`${n.name}: ${n.value} students`} style={{ cursor: 'pointer' }}
                  onPointerMove={(e) => point(e, { node: n })} onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ node: n, x: (n.x0 + n.x1) / 2, y: n.y0 })} onBlur={() => setHover(null)}
                  onClick={() => togglePin({ node: n.index })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePin({ node: n.index }); } }}>
                  <rect x={n.x0} y={n.y0} width={n.x1 - n.x0} height={Math.max(1, n.y1 - n.y0)} rx={2}
                    style={{ fill: litNode(n) ? 'var(--chart-1)' : 'var(--color-text-muted)', transition: 'fill 200ms' }} />
                  <text x={labelLeft ? n.x0 - 6 : n.x1 + 6} y={(n.y0 + n.y1) / 2} dy="0.35em" textAnchor={labelLeft ? 'end' : 'start'}
                    className="viz-label" style={{ fontSize: compact ? 10.5 : 12, fontWeight: litNode(n) ? 700 : 400, paintOrder: 'stroke', stroke: 'var(--color-surface)', strokeWidth: 3, pointerEvents: 'none' }}>
                    {compact ? n.short : n.name}
                    {showValue && <tspan className="viz-label-muted" dx={5} style={{ fontWeight: 400 }}>{n.value}</tspan>}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            {hover.link ? (
              <>
                <div className="viz-tooltip-title">{hover.link.source.name} → {hover.link.target.name}</div>
                <TooltipRow color="var(--chart-1)" label="Students" value={hover.link.value} />
                {hover.link.source.stage === 1 && <TooltipRow label="Entry pathway" value={PATHWAYS[hover.link.pathway]} />}
              </>
            ) : (
              <>
                <div className="viz-tooltip-title">{STAGES[hover.node.stage]}: {hover.node.name}</div>
                <TooltipRow color="var(--chart-1)" label="Students" value={hover.node.value} />
                <TooltipRow label="Share of all students" value={percent(hover.node.value / TOTAL)} />
              </>
            )}
          </ChartTooltip>
        )}
      </div>
      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>Outcome by entry pathway (students)</caption>
            <thead><tr><th scope="col">Pathway</th>{OUTCOMES.map((o) => <th key={o} scope="col" className="num">{o}</th>)}</tr></thead>
            <tbody>
              {PATHWAYS.map((p, i) => (
                <tr key={p}><th scope="row">{p}</th>{crosstab[i].map((v, o) => <td key={OUTCOMES[o]} className="num">{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
