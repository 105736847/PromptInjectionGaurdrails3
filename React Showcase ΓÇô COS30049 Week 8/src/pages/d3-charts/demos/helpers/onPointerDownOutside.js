/**
 * onPointerDownOutside – call `hide` when a pointer goes down anywhere OUTSIDE `node`.
 * A touch screen has no "hover end": when a finger lifts, the charts on this page keep
 * the tooltip open so it can be read. This closes it when the reader taps somewhere else.
 * Use it inside the chart's D3 effect, next to the pointer handlers, and call the
 * function it returns in the cleanup (so StrictMode's second run doesn't add a 2nd listener):
 *
 *   const stopDismiss = onPointerDownOutside(g.node(), hide);
 *   return () => { stopDismiss(); … };
 */
export default function onPointerDownOutside(node, hide) {
  const listener = (event) => {
    if (!node.contains(event.target)) hide();
  };
  // capture: true → we still hear the tap even if the element that was tapped stops it bubbling.
  document.addEventListener('pointerdown', listener, true);
  return () => document.removeEventListener('pointerdown', listener, true);
}
