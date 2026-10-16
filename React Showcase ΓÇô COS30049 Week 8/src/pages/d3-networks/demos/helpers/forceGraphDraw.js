/**
 * forceGraphDraw.js – the D3 drawing code used by ForceGraph.jsx.
 * ForceGraph.jsx decides WHEN things happen (effects, events);
 * these functions decide WHAT the SVG looks like (plus one custom force).
 */
import * as d3 from 'd3';
import { motion } from './motion.js';

/** One <line> per link and one <g> (circle + label) per node. .join() makes it safe to call twice. */
export function drawGraph(g, { nodes, links }, arrowId) {
  const link = g.selectAll('line').data(links).join('line')
    .style('stroke', 'var(--chart-axis)').style('stroke-width', 1.5)
    .attr('marker-end', `url(#${arrowId})`);

  const node = g.selectAll('g.node').data(nodes, (d) => d.id)
    .join((enter) => {
      const n = enter.append('g').attr('class', 'node').attr('tabindex', 0)
        .attr('aria-label', (d) => `${d.id} ${d.name}, year ${d.year}`);
      n.append('circle').attr('r', (d) => d.r).style('fill', (d) => `var(--chart-${d.year})`);
      n.append('text').attr('class', 'viz-label-muted').text((d) => d.id)
        .attr('x', (d) => d.r + 4).attr('dy', '0.32em').style('font-size', '10px')
        .style('paint-order', 'stroke').style('stroke', 'var(--color-surface)').style('stroke-width', 3);
      return n;
    })
    .style('cursor', 'grab');

  return { link, node };
}

/** Runs on every simulation tick: move nodes to their new x/y and redraw the links. */
export function positionGraph(link, node) {
  link.each(function drawLink(d) {
    // Stop the line at the edge of the target circle so the arrowhead stays visible.
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    const len = Math.hypot(dx, dy) || 1;
    d3.select(this)
      .attr('x1', d.source.x).attr('y1', d.source.y)
      .attr('x2', d.target.x - (dx / len) * (d.target.r + 2))
      .attr('y2', d.target.y - (dy / len) * (d.target.r + 2));
  });
  node.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

/** Pinned nodes (fx/fy set) get a dark ring so students can see what they fixed. */
export function paintPins(gElement) {
  d3.select(gElement).selectAll('circle')
    .style('stroke', (d) => (d.fx != null ? 'var(--color-text)' : 'var(--color-surface)'))
    .style('stroke-width', (d) => (d.fx != null ? 3 : 2));
}

/**
 * Highlight a prerequisite chain (a Set of ids, or null for "show everything"):
 * other nodes and links fade out, links on the chain get darker and thicker.
 * Labels: on a phone (compact) only the hubs – units that unlock 3 or more others, the
 * biggest circles – and the highlighted chain are labelled, so labels don't pile up.
 * The unit found by the search gets a bigger, bold, dark label so it stands out in its chain.
 */
export function paintHighlight(gElement, { chain, selected, compact, arrowId }) {
  const g = d3.select(gElement);
  const onPath = (l) => chain && chain.has(l.source.id) && chain.has(l.target.id);
  g.selectAll('g.node').transition().duration(motion(200)).style('opacity', (d) => (!chain || chain.has(d.id) ? 1 : 0.15));
  g.selectAll('line')
    .style('stroke', (l) => (onPath(l) ? 'var(--color-text-muted)' : 'var(--chart-axis)'))
    .style('stroke-width', (l) => (onPath(l) ? 2.5 : 1.5))
    .attr('marker-end', (l) => `url(#${arrowId}${onPath(l) ? '-on' : ''})`)
    .transition().duration(motion(200))
    .style('opacity', (l) => (!chain || onPath(l) ? 1 : 0.08));
  g.selectAll('g.node text')
    .style('display', (d) => (!compact || d.r > 10 || chain?.has(d.id) ? null : 'none'))
    .style('font-size', (d) => (d.id === selected ? '12px' : '10px'))
    .style('font-weight', (d) => (d.id === selected ? 700 : null))
    .style('fill', (d) => (d.id === selected ? 'var(--color-text)' : null));
}

/**
 * A custom force. A force is just a function the simulation calls on every tick; this one
 * pushes nodes back inside the visible frame (the viewBox is centred on 0,0), leaving room
 * for the label on the right, so nothing gets clipped on a narrow screen.
 */
export function forceBounds(width, height) {
  const [left, right, top, bottom] = [-width / 2 + 14, width / 2 - 66, -height / 2 + 14, height / 2 - 14];
  let nodes = [];
  function force() {
    for (const d of nodes) {
      d.x = Math.max(left, Math.min(right, d.x));
      d.y = Math.max(top, Math.min(bottom, d.y));
    }
  }
  force.initialize = (simulationNodes) => { nodes = simulationNodes; }; // d3 hands every force its nodes
  return force;
}
