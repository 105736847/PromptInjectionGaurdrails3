/**
 * UpdaterPitfall – setCount(count + 1) vs setCount(c => c + 1).
 *
 * Inside one render, `count` is a constant – a snapshot. Calling
 * setCount(count + 1) three times asks for "0 + 1" three times, so you get 1.
 *
 * Passing a FUNCTION (an "updater") tells React: "take whatever the latest
 * value is and add one". React queues the three updaters and runs them in
 * order: 0 → 1 → 2 → 3.
 */
import { useState } from 'react';

export default function UpdaterPitfall() {
  const [count, setCount] = useState(0);
  const [explanation, setExplanation] = useState('Click one of the +3 buttons.');

  function addThreeWrong() {
    setCount(count + 1); // count is (say) 0 → "set it to 1"
    setCount(count + 1); // count is STILL 0 → "set it to 1"
    setCount(count + 1); // count is STILL 0 → "set it to 1"
    setExplanation(`Queued: set ${count + 1}, set ${count + 1}, set ${count + 1}  →  result ${count + 1}`);
  }

  function addThreeRight() {
    setCount((c) => c + 1); // React passes the latest value in: 0 → 1
    setCount((c) => c + 1); // 1 → 2
    setCount((c) => c + 1); // 2 → 3
    setExplanation(`Queued: c => c + 1 (×3)  →  ${count} → ${count + 1} → ${count + 2} → ${count + 3}`);
  }

  return (
    <div className="stack">
      <p className="state-big-number m-0" aria-live="polite">{count}</p>
      <div className="row">
        <button type="button" className="btn btn-danger" onClick={addThreeWrong}>
          +3 (wrong)
        </button>
        <button type="button" className="btn btn-success" onClick={addThreeRight}>
          +3 (right)
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { setCount(0); setExplanation('Reset to 0.'); }}>
          Reset
        </button>
      </div>
      <pre className="demo-output">{explanation}</pre>
      <div className="grid-2 small">
        <pre className="demo-output">{`// ❌ reads the snapshot 3 times
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);`}</pre>
        <pre className="demo-output">{`// ✅ each updater gets the latest value
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);`}</pre>
      </div>
    </div>
  );
}
