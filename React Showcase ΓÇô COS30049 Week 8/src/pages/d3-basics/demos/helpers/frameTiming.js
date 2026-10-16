/**
 * frameTiming.js – measure how long the browser takes to SHOW a change.
 *
 * performance.now() around your own code only measures the JavaScript. After it
 * returns, the browser still has to recalculate styles, lay out and paint – and
 * it only paints when the screen refreshes (vsync: every ≈ 16.7 ms at 60 Hz).
 *
 *   requestAnimationFrame(cb)          → cb runs just BEFORE the next paint
 *   setTimeout(cb, 0) queued inside cb → runs just AFTER that paint
 *
 * So "time until painted" includes waiting for the next refresh: even a drawing
 * that takes 0 ms can report up to one frame. Code that already runs INSIDE an
 * animation frame (a d3 transition, e.g. the zoom buttons) always waits a whole
 * frame – that is the vsync floor, ≈ 16.7 ms at 60 Hz or 8.3 ms at 120 Hz.
 */

/** Calls back right after the next paint. Returns a cancel function (call it in effect cleanups). */
export function afterNextPaint(callback) {
  let timeout;
  const frame = requestAnimationFrame(() => {
    timeout = setTimeout(callback, 0);
  });
  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
  };
}

/** 12.345 → "12.3 ms"; undefined (nothing measured yet) → "–". */
export function formatMs(ms) {
  return ms === undefined ? '–' : `${ms.toFixed(1)} ms`;
}
