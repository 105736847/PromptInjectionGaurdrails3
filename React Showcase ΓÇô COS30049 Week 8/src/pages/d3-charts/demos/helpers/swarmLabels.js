/**
 * swarmLabels.js – the text layer of Beeswarm.jsx: row titles and the names of found students.
 *
 *   const { titles, boxes } = drawRowTitles(layer, stats, { row, x, t });   // when the grouping changes
 *   joinNameLabels(layer, found);                                // when the search changes
 *   placeNameLabels(layer, { nodes, obstacles: boxes, width, height, dotRadius });   // every tick
 *
 * A name label sits on a short leader line, in the nearby spot that covers the fewest
 * highlighted dots, row titles and other labels. Boxes are { x0, x1, y0, y1 } in plot pixels.
 */
import * as d3 from 'd3';

const LABEL_H = 14;
const SPOTS = [-18, 20, -30, 32, -42, 44, -54, 56]; // label centre above (−) / below (+) the dot, nearest first

const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// One title per row ("Data Science · 44 students · median 60") on a surface-coloured background,
// so the pass-mark line never runs through the text, plus a short rule at the row's median.
// Returns the titles (to interrupt their transition) and their boxes (name labels must not cover them).
export function drawRowTitles(layer, stats, { row, x, t }) {
  const titles = layer.selectAll('g').data(stats, (d) => d.name).join(
    (enter) => {
      const g = enter.append('g').style('opacity', 0).attr('transform', (d) => `translate(0,${row(d.name)})`);
      g.append('rect').attr('class', 'd3c-label-bg').attr('x', -3).attr('height', 16);
      g.append('text').attr('class', 'viz-label').attr('y', 12);
      g.append('line').attr('class', 'd3c-rule');
      return g;
    },
    (update) => update,
    (exit) => exit.transition(t).style('opacity', 0).remove(),
  );
  titles.select('text').text((d) => `${d.name} · ${d.n} students · median ${d.median}`);
  const mid = row.bandwidth() / 2 + 8; // where forceY pulls the dots
  titles.select('line').attr('x1', (d) => x(d.median)).attr('x2', (d) => x(d.median))
    .attr('y1', Math.max(20, mid - 60)).attr('y2', Math.min(row.bandwidth(), mid + 60));
  titles.transition(t).style('opacity', 1).attr('transform', (d) => `translate(0,${row(d.name)})`);

  const boxes = [];
  titles.each(function (d) {
    const w = this.querySelector('text').getComputedTextLength() + 6;
    d3.select(this).select('rect').attr('width', w);
    boxes.push({ x0: 0, x1: w, y0: row(d.name), y1: row(d.name) + 16 });
  });
  return { titles, boxes };
}

// A keyed join: labels of students that are still found stay put, new ones are created, the rest removed.
export function joinNameLabels(layer, found) {
  layer.selectAll('g').data(found, (d) => d.id).join((enter) => {
    const label = enter.append('g').attr('class', 'found');
    label.append('line').attr('class', 'd3c-leader');
    label.append('text').attr('class', 'viz-label d3c-halo').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .text((d) => d.name);
    // Measure the name once, here – measuring on every tick would force a layout 60× a second.
    return label.each(function () { this.labelWidth = this.lastChild.getComputedTextLength(); });
  });
}

// Every candidate spot gets a score: how many highlighted dots, obstacles and earlier labels its box
// would cover. d3.least picks the lowest score – on a tie the first spot wins, i.e. the nearest one.
export function placeNameLabels(layer, { nodes, obstacles, width, height, dotRadius }) {
  const marked = nodes.filter((n) => n.found);
  const boxes = [...obstacles]; // grows as labels are placed, so later labels avoid earlier ones
  layer.selectAll('.found').each(function (d) {
    const w = this.labelWidth + 8;
    const box = (dx, dy) => {
      const cx = Math.max(w / 2, Math.min(width - w / 2, d.x + dx)); // keep it inside the plot
      return { cx, cy: d.y + dy, x0: cx - w / 2, x1: cx + w / 2, y0: d.y + dy - LABEL_H / 2, y1: d.y + dy + LABEL_H / 2 };
    };
    const covers = (b, n) => n.x > b.x0 - dotRadius && n.x < b.x1 + dotRadius && n.y > b.y0 - dotRadius && n.y < b.y1 + dotRadius;
    const score = (b) => (b.y0 < 0 || b.y1 > height ? Infinity : 0)
      + 10 * boxes.filter((o) => overlaps(b, o)).length
      + marked.filter((n) => covers(b, n)).length;
    // Straight above / below, or shifted so the label ends just left / right of the dot.
    const spots = SPOTS.flatMap((dy) => [0, -1, 1].map((side) => box(side * (w / 2 + 4), dy)));
    const best = d3.least(spots, score);
    boxes.push(best);

    const label = d3.select(this);
    label.select('text').attr('x', best.cx).attr('y', best.cy);
    const dir = Math.sign(best.cy - d.y); // −1: label above the dot, +1: below
    label.select('line') // from the dot's edge to the nearest point on the label's edge
      .attr('x1', d.x).attr('y1', d.y + dir * dotRadius)
      .attr('x2', Math.max(best.x0, Math.min(best.x1, d.x))).attr('y2', best.cy - dir * (LABEL_H / 2));
  });
}
