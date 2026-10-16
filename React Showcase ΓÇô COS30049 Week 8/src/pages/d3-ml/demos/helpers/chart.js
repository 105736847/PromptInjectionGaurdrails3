/**
 * chart.js – tiny helpers shared by the charts on this page.
 *
 * Nothing here is React-specific: they are plain functions that return
 * numbers, strings or colours, so both "D3 calculates, React renders" and
 * "D3 owns the <g>" demos can use them.
 */
import * as d3 from 'd3';

/**
 * A vertical bar (column) with a 4px rounded DATA end and a square BASELINE.
 * Works in both directions: yEnd above yBase (grows up) or below (grows down).
 * The path always has the same commands, so D3 can transition one into another.
 */
export function columnPath(x, width, yBase, yEnd, radius = 4) {
  const s = yEnd < yBase ? 1 : -1; // 1 = grows upwards
  const r = Math.min(radius, width / 2, Math.abs(yEnd - yBase));
  return `M${x},${yBase} V${yEnd + s * r} Q${x},${yEnd} ${x + r},${yEnd} H${x + width - r} Q${x + width},${yEnd} ${x + width},${yEnd + s * r} V${yBase} Z`;
}

/**
 * horizontalBarPath(y, height, xBase, xEnd, radius = 4) – the horizontal twin of
 * columnPath: a bar lying on its side, square at xBase, rounded at xEnd.
 *   y       top edge of the bar (px)
 *   height  the bar's thickness (px)
 *   xBase   x of the square baseline, usually x(0)
 *   xEnd    x of the rounded data end – LEFT of xBase for a negative value
 * (Not the same as d3-basics' barPath(x, y, width, height) – hence the longer name.)
 */
export function horizontalBarPath(y, height, xBase, xEnd, radius = 4) {
  const s = xEnd >= xBase ? 1 : -1; // 1 = grows to the right
  const r = Math.min(radius, height / 2, Math.abs(xEnd - xBase));
  return `M${xBase},${y} H${xEnd - s * r} Q${xEnd},${y} ${xEnd},${y + r} V${y + height - r} Q${xEnd},${y + height} ${xEnd - s * r},${y + height} H${xBase} Z`;
}

/** Users can ask the OS for less motion – D3 transitions should respect that. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Transition length in ms, or 0 when the user prefers reduced motion. */
export function motion(ms) {
  return prefersReducedMotion() ? 0 : ms;
}

// The ONE place with fixed colours: text drawn on top of a coloured fill must
// contrast with that fill, whatever the page theme is.
const DARK_INK = '#10131a';
const LIGHT_INK = '#ffffff';

/** Pick dark or white text for a label that sits inside a coloured cell. */
export function inkOn(fill) {
  return d3.lab(fill).l > 60 ? DARK_INK : LIGHT_INK;
}

// Measuring text WITHOUT touching the page: one off-screen canvas, created on first use.
let measureContext;

/** Width in px of `text` in the page's font at `size` px (SVG labels on this page are 12px). */
export function textWidth(text, size = 12, weight = 400) {
  measureContext ??= document.createElement('canvas').getContext('2d');
  measureContext.font = `${weight} ${size}px ${getComputedStyle(document.body).fontFamily}`;
  return measureContext.measureText(text).width;
}

/** Shorten `text` with "…" until it fits `maxWidth` px. `keepEnd` (e.g. " = 4380") is never cut. */
export function fitText(text, maxWidth, keepEnd = '') {
  if (textWidth(text) <= maxWidth) return text;
  let head = text.slice(0, text.length - keepEnd.length);
  while (head.length > 1 && textWidth(`${head}…${keepEnd}`) > maxWidth) head = head.slice(0, -1);
  return `${head}…${keepEnd}`;
}

export const pct = d3.format('.1%'); // 0.9412 → "94.1%"
export const pct0 = d3.format('.0%'); // 0.9412 → "94%"
export const num = d3.format(','); // 1234 → "1,234"
