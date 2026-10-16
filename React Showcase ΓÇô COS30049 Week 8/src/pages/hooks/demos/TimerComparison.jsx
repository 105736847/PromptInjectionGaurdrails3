/**
 * TimerComparison – shows both timers side by side.
 * The switch mounts / unmounts them, which triggers componentWillUnmount in
 * the class and the effect cleanup in the function version.
 */
import { useState } from 'react';
import ClassTimer from './ClassTimer.jsx';
import FunctionTimer from './FunctionTimer.jsx';

export default function TimerComparison() {
  const [show, setShow] = useState(true);

  return (
    <div className="stack">
      <label className="switch">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        <span className="switch-track" /> Show the timers (switch off = unmount = clearInterval)
      </label>
      {show ? (
        <div className="grid-2">
          <ClassTimer label="class ClassTimer extends Component" />
          <FunctionTimer label="function FunctionTimer()" />
        </div>
      ) : (
        <p className="muted small m-0">Both timers are unmounted. Switch back on – they start again from 00:00.</p>
      )}
    </div>
  );
}
