/**
 * motion.js – respect the "reduce motion" setting of the operating system.
 *
 *   selection.transition().duration(motion(750))   // 0 ms for users who asked for less motion
 */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motion(ms) {
  return prefersReducedMotion() ? 0 : ms;
}
