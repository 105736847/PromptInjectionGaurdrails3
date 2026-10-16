/**
 * FunctionTimer – exactly the same timer, written with hooks.
 *
 * Compare with ClassTimer.jsx:
 *   - no constructor, no `this`, no binding
 *   - one useState per piece of state
 *   - ONE useEffect replaces componentDidMount + componentDidUpdate +
 *     componentWillUnmount: it starts the interval when `running` is true,
 *     and its cleanup stops it (when running changes OR the timer unmounts).
 */
import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

export default function FunctionTimer({ label = 'Function component + hooks' }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return undefined; // paused → no interval
    const intervalId = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(intervalId);
  }, [running]); // re-run only when `running` changes

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="card stack-sm hooks-timer">
      <span className="badge badge-code">{label}</span>
      <span className="hooks-timer-value">{mm}:{ss}</span>
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={14} /> : <Play size={14} />} {running ? 'Pause' : 'Resume'}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSeconds(0)}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
