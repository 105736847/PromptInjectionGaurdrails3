/**
 * scrollFriendlyZoom.js – d3.zoom settings for a chart on a long, scrolling page.
 *
 * Out of the box d3.zoom grabs EVERY mouse-wheel turn and one-finger swipe over
 * the chart, so a student scrolling down the page suddenly zooms the chart
 * instead. These two settings give plain scrolling back to the page:
 *
 *   d3.zoom().filter(zoomFilter).wheelDelta(wheelDelta)
 *
 *  - mouse wheel: zooms only while Ctrl (Windows/Linux) or ⌘ (Mac) is held;
 *    a trackpad pinch also arrives as "Ctrl + wheel", so pinching still works,
 *  - touch: one finger scrolls the page, two fingers pan and pinch the chart,
 *  - mouse drag: pans with the left button (Ctrl + click is a right-click on a Mac).
 */

/** Which events may start a zoom/pan gesture? Return false → d3.zoom ignores the event. */
export function zoomFilter(event) {
  if (event.type === 'wheel') return event.ctrlKey || event.metaKey;
  if (event.type.startsWith('touch')) return event.touches.length > 1;
  return !event.ctrlKey && !event.button; // 0 = left mouse button
}

/** How far one wheel event zooms (2^delta). d3's default is 10× faster while Ctrl is held
    (made for tiny trackpad-pinch steps), so one mouse-wheel notch would jump 4×. We cap
    every step at 2^0.3 ≈ 1.23×. */
export function wheelDelta(event) {
  const delta = -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
  return Math.max(-0.3, Math.min(0.3, delta));
}
