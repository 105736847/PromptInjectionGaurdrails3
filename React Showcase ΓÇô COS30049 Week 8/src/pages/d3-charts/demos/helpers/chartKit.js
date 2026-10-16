/**
 * chartKit.js – five small helpers shared by the charts on this page.
 * Nothing magic here: read them once, then look for where each demo uses them.
 */
import * as d3 from 'd3';

// 1. Motion. People can ask their operating system for less animation – respect it.
//    motion(600) → 600 normally, 0 (= jump straight to the end) when "reduce motion" is on.
export function motion(ms) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return reduce ? 0 : ms;
}

// 2. Bar shapes: 4px rounded at the data end, square at the baseline.
//    Both return a path with the SAME commands every time, so D3 can transition the
//    "d" attribute smoothly from one bar to another (it interpolates the numbers).
export function columnPath(x, y, width, height, radius = 4) {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const r = Math.min(radius, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function barPath(x, y, width, height, radius = 4) {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const r = Math.min(radius, h / 2, w);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}

// 3. A page-friendly d3.zoom(). Out of the box D3 grabs EVERY mouse-wheel turn and one-finger
//    swipe over the chart, so scrolling down the page suddenly zooms the chart instead. Here:
//    • mouse wheel: zooms only while Ctrl (Windows/Linux) or ⌘ (Mac) is held – a trackpad pinch
//      also arrives as "Ctrl + wheel", so pinching still works; a plain wheel scrolls the page
//    • touch: one finger scrolls the page, two fingers pan and pinch the chart
//    • mouse: drag pans (left button only), double-click zooms in
//    filter() decides which events may start a gesture; wheelDelta() how far one wheel step zooms
//    (capped at 2^0.3 ≈ 1.23×, so one Ctrl + wheel notch never jumps 4× at once).
export function pageFriendlyZoom() {
  return d3
    .zoom()
    .filter((event) => {
      if (event.type === 'wheel') return event.ctrlKey || event.metaKey;
      if (event.type.startsWith('touch')) return event.touches.length > 1;
      return !event.ctrlKey && !event.button;
    })
    .wheelDelta((event) => {
      const delta = -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
      return Math.max(-0.3, Math.min(0.3, delta));
    });
}

// 4. Least-squares straight line through a cloud of points: y = slope · x + intercept,
//    plus Pearson's r (−1 … 1) to say how well the line fits.
export function linearFit(data, fx, fy) {
  const mx = d3.mean(data, fx);
  const my = d3.mean(data, fy);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const d of data) {
    const dx = fx(d) - mx;
    const dy = fy(d) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx, r: sxy / Math.sqrt(sxx * syy) };
}

// 5. useId() returns ids such as «r3» – fine for React, awkward inside url(#…).
export const svgId = (reactId, name) => `${name}-${reactId.replace(/[^\w-]/g, '')}`;
