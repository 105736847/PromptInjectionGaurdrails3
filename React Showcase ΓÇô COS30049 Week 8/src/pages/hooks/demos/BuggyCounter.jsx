/**
 * BuggyCounter – what happens when a component crashes while rendering?
 *
 * Without protection, one error thrown during rendering removes the WHOLE
 * app from the screen. An Error Boundary catches the error for the part of
 * the tree it wraps and shows a fallback instead.
 *
 * ErrorBoundary (src/components/common/ErrorBoundary.jsx) is a CLASS
 * component – catching render errors still has no hook equivalent.
 *
 * Note: boundaries catch errors thrown while RENDERING. Errors inside event
 * handlers or setTimeout callbacks are not caught – use try/catch for those.
 */
import { useState } from 'react';
import { Bug, RotateCcw } from 'lucide-react';
import ErrorBoundary from '../../../components/common/ErrorBoundary.jsx';

function BuggyCounter({ label }) {
  const [count, setCount] = useState(0);

  if (count === 3) {
    // Simulates a real bug, e.g. reading a property of `undefined` during render.
    throw new Error(`${label} crashed when the count reached 3!`);
  }

  return (
    <button type="button" className="btn" onClick={() => setCount((c) => c + 1)}>
      <Bug size={16} aria-hidden="true" /> {label}: {count}
    </button>
  );
}

// A custom fallback: ErrorBoundary calls this function with the error and a reset function.
function renderFallback(error, reset) {
  return (
    <div className="alert alert-danger" role="alert">
      <Bug size={20} aria-hidden="true" />
      <div className="stack-sm">
        <strong>This widget crashed – the rest of the page is fine.</strong>
        <span className="small mono">{error.message}</span>
        <div>
          <button type="button" className="btn btn-sm" onClick={reset}>
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuggyCounterDemo() {
  return (
    <div className="stack">
      <p className="small muted m-0">Each counter crashes when it reaches 3. Each has its OWN boundary.</p>
      <div className="grid-2">
        <ErrorBoundary fallback={renderFallback}>
          <BuggyCounter label="Counter A" />
        </ErrorBoundary>
        <ErrorBoundary fallback={renderFallback}>
          <BuggyCounter label="Counter B" />
        </ErrorBoundary>
      </div>
    </div>
  );
}
