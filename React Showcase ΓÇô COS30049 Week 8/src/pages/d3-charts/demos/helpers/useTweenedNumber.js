/**
 * useTweenedNumber – a number that COUNTS to its new value instead of jumping.
 *
 *   const shown = useTweenedNumber(average);   // e.g. 61.2 → 64.8 over 600 ms
 *
 * d3.interpolateNumber(a, b) returns a function t → number (t from 0 to 1) and
 * d3.timer calls us once per animation frame until we stop it. The effect's cleanup
 * stops the timer, so a new target (or unmounting) never leaves an old animation running.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from './chartKit.js';

export default function useTweenedNumber(target, duration = 600) {
  const [value, setValue] = useState(target);
  const current = useRef(target); // the value on screen right now (where the next tween starts)

  useEffect(() => {
    const interpolate = d3.interpolateNumber(current.current, target);
    const ms = motion(duration);
    const timer = d3.timer((elapsed) => {
      const t = ms ? Math.min(1, elapsed / ms) : 1;
      current.current = interpolate(d3.easeCubicOut(t));
      setValue(current.current);
      if (t === 1) timer.stop();
    });
    return () => timer.stop();
  }, [target, duration]);

  return value;
}
