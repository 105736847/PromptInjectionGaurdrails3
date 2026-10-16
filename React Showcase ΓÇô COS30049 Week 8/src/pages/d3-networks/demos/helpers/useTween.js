import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { prefersReducedMotion } from './motion.js';

/**
 * useTween – smoothly animates a value towards `target`: a number, an array,
 * an object, or any mix of them (e.g. { shapes: [{ cx, cy }, …], opacity }).
 *
 * This is how a "D3 calculates, React renders" chart can still animate:
 * d3.interpolate(from, to) builds a function t → "the value at time t" for
 * numbers, arrays and objects alike; d3.timer calls us once per animation
 * frame, and React re-renders with the in-between value.
 *
 *   const target = useMemo(() => [focus.x0, focus.x1], [focus]); // memoise it!
 *   const [x0, x1] = useTween(target, 750);
 *
 * `target` must keep the same identity between renders (useMemo), otherwise
 * every render would start a new animation.
 */
export default function useTween(target, duration = 750) {
  const [frame, setFrame] = useState(target);
  const frameRef = useRef(target); // the value currently on screen

  useEffect(() => {
    const from = frameRef.current;
    if (from === target) return undefined; // first render: nothing to animate

    const ms = prefersReducedMotion() ? 0 : duration;
    const interpolate = d3.interpolate(from, target); // interpolate(0) = from … interpolate(1) = target
    const timer = d3.timer((elapsed) => {
      const t = ms === 0 ? 1 : Math.min(1, elapsed / ms);
      const e = d3.easeCubicInOut(t); // slow → fast → slow
      // d3 re-uses ONE result object for every frame – copy it, or React would see "no change".
      frameRef.current = t === 1 ? target : structuredClone(interpolate(e));
      setFrame(frameRef.current);
      if (t === 1) timer.stop();
    });
    return () => timer.stop(); // new target or unmount → stop the old animation
  }, [target, duration]);

  return frame;
}
