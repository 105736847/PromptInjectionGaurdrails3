/**
 * ExpensiveCalc – useMemo caches the result of a slow calculation.
 *
 *   const result = useMemo(() => slowFunction(limit), [limit]);
 *
 * React re-runs slowFunction only when `limit` changes. On every other
 * re-render (e.g. toggling the unrelated "highlight" state) it hands back the
 * cached result instantly.
 *
 * Turn useMemo off, drag the slider to the right, then click "Toggle
 * highlight": the UI feels sluggish because the primes are recounted on
 * EVERY render.
 */
import { useId, useMemo, useState } from 'react';

// Deliberately slow: test every number by trial division.
function countPrimes(limit) {
  const started = performance.now();
  let count = 0;
  for (let n = 2; n <= limit; n += 1) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d += 1) {
      if (n % d === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) count += 1;
  }
  const now = new Date();
  return {
    count,
    ms: performance.now() - started,
    at: `${now.toLocaleTimeString('en-AU', { hour12: false })}.${String(now.getMilliseconds()).padStart(3, '0')}`,
  };
}

export default function ExpensiveCalc() {
  const [limit, setLimit] = useState(200000);
  const [highlight, setHighlight] = useState(false); // unrelated to the calculation
  const [memoOn, setMemoOn] = useState(true);
  const id = useId();

  // Hooks can't be called conditionally, so we ALWAYS call useMemo…
  const memoised = useMemo(() => countPrimes(limit), [limit]);
  // …and only when memo is switched off do we (wastefully) recalculate on every render.
  const result = memoOn ? memoised : countPrimes(limit);

  return (
    <div className={`stack hooks-memo-box ${highlight ? 'is-highlighted' : ''}`}>
      <div className="field">
        <label className="label" htmlFor={id}>Count the primes up to {limit.toLocaleString('en-AU')}</label>
        <input id={id} type="range" min={10000} max={600000} step={10000} value={limit}
          onChange={(e) => setLimit(Number(e.target.value))} />
      </div>

      <div className="row">
        <label className="switch">
          <input type="checkbox" checked={memoOn} onChange={(e) => setMemoOn(e.target.checked)} />
          <span className="switch-track" /> useMemo {memoOn ? 'ON' : 'OFF'}
        </label>
        <button type="button" className="btn btn-sm" onClick={() => setHighlight((h) => !h)}>
          Toggle highlight (unrelated state)
        </button>
      </div>

      <dl className="hooks-stats">
        <div><dt>Primes found</dt><dd>{result.count.toLocaleString('en-AU')}</dd></div>
        <div><dt>Calculation took</dt><dd>{result.ms.toFixed(1)} ms</dd></div>
        <div><dt>Last calculated at</dt><dd className="mono">{result.at}</dd></div>
      </dl>
      <p className="hint">
        With useMemo ON, “Last calculated at” only changes when you move the slider. With it OFF, it changes on every
        click of “Toggle highlight” too.
      </p>
    </div>
  );
}
