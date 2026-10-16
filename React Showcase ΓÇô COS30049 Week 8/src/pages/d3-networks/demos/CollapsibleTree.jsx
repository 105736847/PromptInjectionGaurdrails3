/**
 * CollapsibleTree – click a node to expand or collapse it (d3.tree).
 *
 * Pattern: D3 owns the <g>
 * WHICH nodes are open lives in React state (a Set of ids), so buttons outside
 * the SVG can change it too. When it changes, the effect re-runs and D3
 * animates the classic way:
 *   enter  → new nodes grow out of the node you clicked,
 *   update → existing nodes glide to their new position,
 *   exit   → removed nodes shrink back into the node you clicked.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { motion } from './helpers/motion.js';
import { degree } from './data/degree.js';

const DX = 26; // vertical distance between neighbouring nodes
const colour = (d) => (d.depth === 0 ? 'var(--color-text-muted)' : `var(--chart-${d.ancestors().at(-2).id})`); // major id 1…6
const unitCount = (d) => (d.depth === 1 ? d._children.length : d3.sum(d._children, (m) => m._children.length));

export default function CollapsibleTree() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const sourceRef = useRef(0); // id of the node that was toggled – animations start there
  // Built once. `_children` remembers the children while a node is collapsed.
  const [root] = useState(() => {
    const r = d3.hierarchy(degree);
    r.descendants().forEach((d, i) => { d.id = i; d._children = d.children; }); // BFS order: root 0, majors 1…6
    return r;
  });
  const [expanded, setExpanded] = useState(() => new Set([0, 2])); // root + "Artificial Intelligence"
  const [height, setHeight] = useState(DX * 8);
  const [hover, setHover] = useState(null);
  const compact = width < 560;

  useEffect(() => {
    if (width === 0) return undefined;
    const g = d3.select(gRef.current);
    const duration = motion(450);
    const left = 24;
    const right = compact ? 80 : 330; // room for the unit labels
    const dy = (width - left - right) / 2; // two levels of links share the rest of the width
    const maxChars = Math.floor((right - 16) / 6.4);
    const clip = (text) => (text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text);

    // 1. React state → hierarchy: open nodes get their children back.
    (function apply(d) {
      if (!d._children) return;
      d.children = expanded.has(d.id) ? d._children : null;
      d._children.forEach(apply);
    })(root);

    // 2. Layout: d3.tree sets d.x (vertical) and d.y (depth → horizontal).
    d3.tree().nodeSize([DX, dy])(root);
    const nodes = root.descendants();
    const [x0, x1] = d3.extent(nodes, (d) => d.x);
    setHeight(x1 - x0 + DX * 2 + 20); // tell React how tall the <svg> must be
    const source = nodes.find((d) => d.id === sourceRef.current) ?? root;
    const from = `translate(${source.y0 ?? source.y},${source.x0 ?? source.x})`;
    g.transition().duration(duration).attr('transform', `translate(${left},${DX + 20 - x0})`);

    // 3. Links. insert(…, 'g') puts every new link BEFORE the first node group, so all links
    //    stay underneath the nodes and their labels, however often branches open and close.
    const diagonal = d3.linkHorizontal().x((d) => d.y).y((d) => d.x);
    const collapsed = (at) => () => diagonal({ source: at, target: at });
    g.selectAll('path.link').data(root.links(), (l) => l.target.id)
      .join(
        (enter) => enter.insert('path', 'g').attr('class', 'link')
          .attr('d', collapsed({ x: source.x0 ?? source.x, y: source.y0 ?? source.y })),
        (update) => update,
        (exit) => exit.transition().duration(duration).attr('d', collapsed(source)).remove(),
      )
      .style('fill', 'none').style('stroke', 'var(--chart-axis)').style('stroke-width', 1.5)
      .transition().duration(duration).attr('d', diagonal);

    // 4. Nodes.
    const node = g.selectAll('g.node').data(nodes, (d) => d.id)
      .join(
        (enter) => {
          const n = enter.append('g').attr('class', 'node').attr('transform', from).style('opacity', 0).attr('tabindex', 0);
          n.append('circle').attr('r', 5).style('stroke-width', 2);
          // Halo: a wide surface-coloured outline painted BEHIND the letters (paint-order: stroke)
          // hides the link curves that pass under a label, so it never looks struck through.
          n.append('text').attr('dy', '0.32em').attr('class', 'viz-label')
            .style('paint-order', 'stroke').style('stroke', 'var(--color-surface)')
            .style('stroke-width', 6).style('stroke-linejoin', 'round');
          return n;
        },
        (update) => update,
        (exit) => exit.transition().duration(duration).attr('transform', `translate(${source.y},${source.x})`).style('opacity', 0).remove(),
      )
      .attr('role', (d) => (d._children ? 'button' : null))
      .attr('aria-expanded', (d) => (d._children ? Boolean(d.children) : null))
      .style('cursor', (d) => (d._children ? 'pointer' : 'default'));
    node.transition().duration(duration).attr('transform', (d) => `translate(${d.y},${d.x})`).style('opacity', 1);
    // Filled circle = collapsed (there is more inside), hollow = open or a leaf.
    node.select('circle').style('stroke', colour)
      .style('fill', (d) => (d._children && !d.children ? colour(d) : 'var(--color-surface)'));
    // Label placement: leaves → right, open branches → left, degree → above.
    // On a phone the majors sit above their node and long names are shortened.
    const place = (d) => {
      if (d.depth === 0) return { x: -6, y: -16, anchor: 'start' };
      if (compact && d.depth === 1) return { x: 0, y: -12, anchor: 'middle' };
      return d.children ? { x: -10, y: 0, anchor: 'end' } : { x: 10, y: 0, anchor: 'start' };
    };
    // The degree's full name (≈ 180px) sits above its node. If a major right beside it would
    // run into it (its dot, or the label of an open major), the degree gets its short name.
    const leftEdge = (m) => (m.children ? m.y - 10 - m.data.name.length * 6.4 : m.y - 5);
    const crowded = root.children?.some((m) => Math.abs(m.x - (root.x - 16)) < 14 && leftEdge(m) < 180);
    node.select('text')
      .text((d) => {
        if ((compact && d.depth !== 1) || (d.depth === 0 && crowded)) return d.data.short ?? d.data.code; // "BCompSc", "COS30001"
        return d.depth === 2 ? clip(d.data.name) : d.data.name;
      })
      .attr('x', (d) => place(d).x).attr('y', (d) => place(d).y).attr('text-anchor', (d) => place(d).anchor);

    // 5. Interaction – D3 handlers call React state setters.
    const toggle = (d) => {
      if (!d._children) return;
      sourceRef.current = d.id;
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
        return next;
      });
    };
    const paintPath = (d) => {
      const path = new Set(d ? d.ancestors() : []); // highlight the route from the degree to this node
      g.selectAll('path.link').style('stroke', (l) => (path.has(l.target) ? colour(l.target) : 'var(--chart-axis)'))
        .style('stroke-width', (l) => (path.has(l.target) ? 2.5 : 1.5));
    };
    node.on('click', (event, d) => toggle(d))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(d); }
      })
      .on('pointerenter focus', (event, d) => {
        paintPath(d);
        const box = event.currentTarget.getBoundingClientRect();
        const origin = gRef.current.ownerSVGElement.getBoundingClientRect();
        setHover({ d, x: box.x + box.width / 2 - origin.x, y: box.y - origin.y });
      })
      .on('pointerleave blur', () => { paintPath(null); setHover(null); });

    nodes.forEach((d) => { d.x0 = d.x; d.y0 = d.y; }); // stash positions for the next animation
    return () => {
      g.interrupt().selectAll('*').interrupt();
      node.on('click keydown pointerenter focus pointerleave blur', null);
    };
  }, [expanded, width, compact, root]);

  const majors = root._children; // always all six, even while the root is collapsed
  const setAll = (open) => { sourceRef.current = 0; setExpanded(new Set(open ? [0, ...majors.map((m) => m.id)] : [0])); };
  const toggleMajor = (id) => {
    sourceRef.current = id;
    setExpanded((prev) => new Set(prev.has(id) ? [...prev].filter((x) => x !== id) : [...prev, 0, id])); // opening also opens the root
  };

  return (
    <figure className="m-0">
      <div className="viz-controls">
        <button type="button" className="btn btn-sm" onClick={() => setAll(true)}><ChevronsUpDown size={15} aria-hidden="true" />Expand all</button>
        <button type="button" className="btn btn-sm" onClick={() => setAll(false)}><ChevronsDownUp size={15} aria-hidden="true" />Collapse all</button>
      </div>
      {/* The legend doubles as a keyboard-friendly way to open each major.
          Its dots speak the tree's language: filled = closed, hollow = open (see d3-networks.css). */}
      <ul className="viz-legend" aria-label="Majors (click to expand or collapse)">
        {majors.map((m) => (
          <li key={m.id}>
            <button type="button" aria-pressed={expanded.has(m.id)} className="d3-networks-legend-toggle"
              onClick={() => toggleMajor(m.id)}>
              <span className="viz-swatch d3-networks-dot" style={{ '--swatch': `var(--chart-${m.id})` }} />{m.data.name}
            </button>
          </li>
        ))}
        <li className="subtle small">Filled = closed · hollow = open</li>
      </ul>
      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": an img hides its children from screen readers,
            but these nodes are buttons with aria-expanded that keyboard users can reach */}
        <svg style={{ width: '100%', height, transition: 'height 450ms ease' }} role="group"
          aria-label="Collapsible tree of the Bachelor of Computer Science: majors and their units.">
          <g ref={gRef} />
        </svg>
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            <div className="viz-tooltip-title">{hover.d.data.name}</div>
            {hover.d.depth === 2 && <TooltipRow color={colour(hover.d)} keyClass="d3-networks-dot" label="Major" value={hover.d.parent.data.name} />}
            {hover.d.depth === 1 && <TooltipRow color={colour(hover.d)} keyClass="d3-networks-dot" label="Units" value={unitCount(hover.d)} />}
            {hover.d.depth === 0 && (
              <>
                <TooltipRow color={colour(hover.d)} keyClass="d3-networks-dot" label="Majors" value={hover.d._children.length} />
                <TooltipRow label="Units" value={unitCount(hover.d)} />
              </>
            )}
            {hover.d._children && <div className="subtle small mt-1">Click to {hover.d.children ? 'collapse' : 'expand'}</div>}
          </ChartTooltip>
        )}
      </div>
      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>{degree.name}: majors and their units</caption>
            <thead><tr><th scope="col">Major</th><th scope="col">Units</th></tr></thead>
            <tbody>
              {degree.children.map((m) => (
                <tr key={m.name}><th scope="row">{m.name}</th><td>{m.children.map((u) => u.name).join(', ')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
