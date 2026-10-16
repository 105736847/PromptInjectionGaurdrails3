/**
 * Counter – the "hello world" of state.
 *
 *   const [count, setCount] = useState(0);
 *          ↑ current value  ↑ function to ask React for a new value
 *
 * Calling setCount() does two things: stores the new value AND re-renders
 * the component, so the screen shows it. A normal variable (let x = 0) would
 * be reset on every render and would never update the screen.
 */
import { useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

const MIN = 0;
const MAX = 20;
const STEPS = [1, 2, 5];

export default function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1); // a component can have as many state variables as it needs

  // Keep the value between MIN and MAX.
  function changeBy(amount) {
    setCount((current) => Math.min(MAX, Math.max(MIN, current + amount)));
  }

  // Derived values – calculated from state, never stored separately.
  const percent = (count / MAX) * 100;
  const atMin = count <= MIN;
  const atMax = count >= MAX;

  return (
    <div className="stack state-counter">
      <div className="state-counter-display">
        <button type="button" className="btn btn-lg" onClick={() => changeBy(-step)} disabled={atMin}
          aria-label={`Decrease by ${step}`}>
          <Minus size={18} />
        </button>
        {/* <output> is the semantic element for the result of a user action */}
        <output className="state-counter-value" aria-live="polite">{count}</output>
        <button type="button" className="btn btn-lg btn-primary" onClick={() => changeBy(step)} disabled={atMax}
          aria-label={`Increase by ${step}`}>
          <Plus size={18} />
        </button>
      </div>

      <meter className="state-meter" min={MIN} max={MAX} value={count} aria-label="Counter value" />

      <div className="row-between">
        <div className="row">
          <span className="label">Step</span>
          <div className="btn-group" role="group" aria-label="Step size">
            {STEPS.map((s) => (
              <button key={s} type="button" className={`btn btn-sm ${step === s ? 'active' : ''}`}
                aria-pressed={step === s} onClick={() => setStep(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCount(0)} disabled={count === 0}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <p className="small muted m-0">
        {atMax ? `Maximum (${MAX}) reached.` : atMin ? `Minimum (${MIN}) reached.` : `${Math.round(percent)}% of the maximum.`}{' '}
        The number is {count % 2 === 0 ? 'even' : 'odd'}.
      </p>
    </div>
  );
}
