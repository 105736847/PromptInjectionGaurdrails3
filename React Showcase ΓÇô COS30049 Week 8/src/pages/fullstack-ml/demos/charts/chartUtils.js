/**
 * chartUtils.js – small helpers shared by the charts on this page.
 * Plain functions (no React): they return numbers, strings and path data.
 */
import * as d3 from 'd3';

/** A column with a 4px rounded top (the data end) and a square baseline. */
export function columnPath(x, width, yBase, yTop, radius = 4) {
  const r = Math.max(0, Math.min(radius, width / 2, yBase - yTop));
  return `M${x},${yBase} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + width - r} Q${x + width},${yTop} ${x + width},${yTop + r} V${yBase} Z`;
}

/** A horizontal bar: square at xBase, rounded at xEnd (which may be left of xBase for negatives). */
export function horizontalBarPath(y, height, xBase, xEnd, radius = 4) {
  const s = xEnd >= xBase ? 1 : -1; // 1 = grows to the right
  const r = Math.max(0, Math.min(radius, height / 2, Math.abs(xEnd - xBase)));
  return `M${xBase},${y} H${xEnd - s * r} Q${xEnd},${y} ${xEnd},${y + r} V${y + height - r} Q${xEnd},${y + height} ${xEnd - s * r},${y + height} H${xBase} Z`;
}

/** Transition length in ms – 0 when the user asked the OS for reduced motion. */
export function motion(ms) {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
}

/** Text on a coloured fill must contrast with the fill, whatever the theme. */
export function inkOn(fill) {
  return d3.lab(fill).l > 60 ? '#10131a' : '#ffffff';
}

export const pct = d3.format('.1%'); // 0.8734 → "87.3%"
export const pct0 = d3.format('.0%'); // 0.8734 → "87%"
export const signed = d3.format('+.2f'); // 1.5 → "+1.50", -0.2 → "−0.20"
export const num = d3.format(','); // 1234 → "1,234"

/** A probability for people: 0.99995 is NOT "100%" – a model is never certain. */
export function probability(p) {
  if (p == null) return '–';
  if (p >= 0.9995) return '> 99.9%';
  if (p < 0.0005) return '< 0.1%';
  return pct(p);
}

/** Milliseconds, with sensible precision: 0.42 ms, 12.3 ms, 245 ms. */
export function ms(value) {
  if (value == null) return '–';
  if (value < 1) return `${value.toFixed(2)} ms`;
  if (value < 100) return `${value.toFixed(1)} ms`;
  return `${Math.round(value)} ms`;
}
