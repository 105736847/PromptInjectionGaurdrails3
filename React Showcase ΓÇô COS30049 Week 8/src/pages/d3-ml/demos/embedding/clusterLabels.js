/**
 * clusterLabels.js – direct labels for the embedding's clusters that never
 * pile up on top of each other (a phone has room for far fewer words).
 *
 * A simple greedy layout with bounding boxes, re-run on every zoom:
 *  1. go through the clusters in PRIORITY order (the biggest cluster first),
 *  2. use the full name if its box hits no label placed so far – and does not
 *     take the space a later label needs for its SHORT name. (On a phone-sized
 *     plot, skip this step: long names would hide too many dots.)
 *  3. otherwise try the short name ("Parcel-delivery scams" → "Parcel scams"),
 *  4. otherwise hide the label. Every name is still in the tooltip and the table.
 * A cluster whose centre is outside the plot (zoomed in elsewhere) gets no label.
 */
import * as d3 from 'd3';
import { textWidth } from '../helpers/chart.js';

const PAD = 5; // px of empty space kept around every label
const ABOVE = 24; // the label sits this far above the cluster's centre
const byPriority = (a, b) => b.count - a.count;
const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/**
 * labels  – the D3 selection of <text> elements, bound to CLUSTERS
 * project – ([dataX, dataY]) → [screenX, screenY], including the current zoom
 * [width, height] – the plot size: labels are nudged sideways to stay inside it
 */
export function placeClusterLabels(labels, project, [width, height]) {
  // Where would `name` go, and which box would it cover? (12px semi-bold text)
  const layout = (c, name) => {
    const [cx, cy] = project([c.cx, c.cy]);
    const half = textWidth(name, 12, 600) / 2;
    const x = Math.max(half + 2, Math.min(width - half - 2, cx)); // keep it inside the plot
    const y = cy - ABOVE;
    const inView = cx >= 0 && cx <= width && cy >= 0 && cy <= height;
    return { name, x, y, inView, box: { x0: x - half - PAD, x1: x + half + PAD, y0: y - 12 - PAD, y1: y + 3 + PAD } };
  };

  const narrow = width < 480;
  const sorted = labels.sort(byPriority); // puts the <text> elements in priority order
  const shortBoxes = sorted.data().map((c) => layout(c, c.short)).map((o) => (o.inView ? o.box : null));
  const placed = []; // boxes of the labels already on screen
  const hitsAny = (box, boxes) => boxes.some((b) => b && overlaps(box, b));

  sorted.each(function place(c, i) {
    const full = layout(c, c.name);
    const short = layout(c, c.short);
    const fullFits = !narrow && !hitsAny(full.box, [...placed, ...shortBoxes.slice(i + 1)]);
    const shown = !full.inView ? null : fullFits ? full : !hitsAny(short.box, placed) ? short : null;
    if (shown) placed.push(shown.box);
    d3.select(this)
      .text(shown?.name ?? '')
      .attr('display', shown ? null : 'none')
      .attr('transform', shown ? `translate(${shown.x},${shown.y})` : null);
  });
}
