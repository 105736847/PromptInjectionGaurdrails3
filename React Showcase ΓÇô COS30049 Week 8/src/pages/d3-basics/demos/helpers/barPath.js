/**
 * barPath.js – SVG path strings for bars with a 4px rounded DATA end and a
 * square BASELINE end (our chart style). A plain <rect rx="4"> would round
 * all four corners, which makes the bar look like it floats above the axis.
 *
 * Both helpers always return the same sequence of commands, so d3-transition
 * can smoothly interpolate one bar path into another.
 */

/** Vertical bar (column): (x, y) = top-left corner, rounded at the top. */
export function barPath(x, y, width, height, radius = 4) {
  const r = Math.max(0, Math.min(radius, height, width / 2));
  return (
    `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}` +
    `H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`
  );
}

/** Horizontal bar: starts at x0, grows to the right, rounded at the right end. */
export function hBarPath(x0, y, length, thickness, radius = 4) {
  const r = Math.max(0, Math.min(radius, length, thickness / 2));
  const x1 = x0 + length;
  return (
    `M${x0},${y}H${x1 - r}Q${x1},${y} ${x1},${y + r}` +
    `V${y + thickness - r}Q${x1},${y + thickness} ${x1 - r},${y + thickness}H${x0}Z`
  );
}
