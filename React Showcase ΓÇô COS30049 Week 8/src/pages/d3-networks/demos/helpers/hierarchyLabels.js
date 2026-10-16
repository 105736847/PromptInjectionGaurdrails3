/**
 * hierarchyLabels.js – where (and whether) HierarchyLayouts.jsx puts a node's name.
 * Every node already has a `shape` = { cx, cy, w, h } computed by the layout.
 */
const CHAR = 6.4; // ≈ width of one character at 11px

/**
 * Pack labels. THE RULE: go through the circles from the LARGEST to the smallest and
 * label a circle if its name fits and does not overlap a label that was already placed.
 * A name that is too long is shortened: first the file extension goes ("Chart.jsx" →
 * "Chart"), then letters are cut and replaced by "…" – but never below three letters.
 *  - a file (leaf) is labelled across its centre: room = the circle's width there,
 *  - a folder is labelled just inside its top edge: room = the chord of the
 *    circle 8px below the top, so the text stays inside the curve.
 * Largest first means the big folders keep their names when space runs out.
 */
export function packLabels(nodes) {
  const placed = []; // boxes of the labels placed so far
  const labels = new Map();
  for (const d of [...nodes].sort((a, b) => b.shape.w - a.shape.w)) {
    const { cx, cy, w } = d.shape;
    const r = w / 2;
    const room = d.children ? 2 * Math.sqrt(Math.max(0, 16 * r - 64)) - 6 : 2 * Math.sqrt(Math.max(0, r * r - 25)) - 4;
    const maxChars = Math.floor(room / CHAR);
    const name = d.data.name;
    const stem = name.replace(/\.[a-z]+$/, ''); // without the extension
    if (r < 8 || maxChars < 4) continue; // not even "abc…" fits
    const text = [name, stem].find((t) => t.length <= maxChars) ?? `${stem.slice(0, maxChars - 1)}…`;
    const y = d.children ? cy - r + 18 : cy + 4; // baseline
    const box = { x0: cx - (text.length * CHAR) / 2 - 2, x1: cx + (text.length * CHAR) / 2 + 2, y0: y - 11, y1: y + 4 };
    if (placed.some((b) => b.x0 < box.x1 && box.x0 < b.x1 && b.y0 < box.y1 && box.y0 < b.y1)) continue;
    placed.push(box);
    labels.set(d, { x: cx, y, anchor: 'middle', text });
  }
  return labels;
}

/** Where (and whether) to put a node's label in this layout. */
export function labelFor(kind, d, packed) {
  const { cx, cy, w, h } = d.shape;
  const text = d.data.name;
  if (kind === 'pack') return packed.get(d) ?? null;
  if (kind === 'tree' || kind === 'cluster') {
    return d.children ? { x: cx, y: cy - 10, anchor: 'middle', text } : { x: cx + 10, y: cy + 4, anchor: 'start', text };
  }
  if (text.length * CHAR + 10 >= w || h < 16) return null;
  return kind === 'treemap' ? { x: cx - w / 2 + 5, y: cy - h / 2 + 14, anchor: 'start', text } : { x: cx - w / 2 + 6, y: cy + 4, anchor: 'start', text };
}
