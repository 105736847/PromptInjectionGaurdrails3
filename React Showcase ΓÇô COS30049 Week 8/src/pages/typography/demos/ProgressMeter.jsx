import { useId, useState } from 'react';

/**
 * Native <progress> and <meter>, driven by one slider.
 *
 * - <progress value max>: how far a TASK has got (uploading, completing a quiz).
 *   Leave out `value` for an "indeterminate" bar (we don't know how long).
 * - <meter min max low high optimum>: a MEASUREMENT within a known range
 *   (disk space, a score). The browser colours it green / yellow / red
 *   depending on which region the value is in and where `optimum` sits.
 * - <output> shows the result of a calculation or user action.
 */
function region(value, { low, high, optimum }) {
  const zone = (v) => (v < low ? 'low' : v > high ? 'high' : 'middle');
  if (zone(value) === zone(optimum)) return 'optimum';
  // One region away from the optimum is "sub-optimal", two away is "bad".
  return zone(value) === 'middle' || zone(optimum) === 'middle' ? 'sub-optimal' : 'bad';
}

const scoreRange = { low: 50, high: 80, optimum: 100 }; // higher is better
const storageRange = { low: 50, high: 80, optimum: 0 }; // lower is better

export default function ProgressMeter() {
  const [value, setValue] = useState(65);
  const id = useId(); // unique ids for htmlFor, even if this demo is rendered twice

  return (
    <div className="stack-lg">
      <div className="field" style={{ maxWidth: 420 }}>
        <label className="label" htmlFor={`${id}-slider`}>
          Value: <output htmlFor={`${id}-slider`}>{value}</output>
        </label>
        <input id={`${id}-slider`} type="range" min="0" max="100" value={value}
          onChange={(e) => setValue(Number(e.target.value))} />
      </div>

      <div className="grid-2">
        <div className="stack-sm">
          <label className="label" htmlFor={`${id}-progress`}>&lt;progress&gt; Assignment completed</label>
          <progress id={`${id}-progress`} value={value} max="100" style={{ width: '100%' }}>
            {value}%
          </progress>
          <span className="small muted">{value}% of tasks done</span>

          <label className="label mt-1" htmlFor={`${id}-busy`}>Indeterminate (no value)</label>
          <progress id={`${id}-busy`} style={{ width: '100%' }}>Loading…</progress>
          <span className="small muted">Use while waiting for the API.</span>
        </div>

        <div className="stack-sm">
          <label className="label" htmlFor={`${id}-score`}>&lt;meter&gt; Quiz score (higher is better)</label>
          <meter id={`${id}-score`} min="0" max="100" value={value} {...scoreRange} style={{ width: '100%' }}>
            {value} / 100
          </meter>
          <span className="small muted">
            low={scoreRange.low} high={scoreRange.high} optimum={scoreRange.optimum} → <strong>{region(value, scoreRange)}</strong>
          </span>

          <label className="label mt-1" htmlFor={`${id}-disk`}>&lt;meter&gt; Storage used (lower is better)</label>
          <meter id={`${id}-disk`} min="0" max="100" value={value} {...storageRange} style={{ width: '100%' }}>
            {value}%
          </meter>
          <span className="small muted">
            low={storageRange.low} high={storageRange.high} optimum={storageRange.optimum} → <strong>{region(value, storageRange)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
