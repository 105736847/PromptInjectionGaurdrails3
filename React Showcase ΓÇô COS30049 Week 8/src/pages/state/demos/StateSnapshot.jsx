/**
 * StateSnapshot – setState does NOT change the variable you already have.
 *
 * Each render gets its own `count`, frozen like a photo ("snapshot").
 * setCount(count + 1) asks React for a NEXT render with a new value;
 * the code that is still running keeps seeing the old one.
 *
 * Batching: React waits until your event handler has finished, then applies
 * all queued updates together and re-renders ONCE.
 */
import { useEffect, useRef, useState } from 'react';

let nextId = 1;

export default function StateSnapshot() {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);
  const timers = useRef([]); // ids of pending timeouts (see the Hooks page for useRef)

  function write(message) {
    const entry = { id: nextId++, message };
    setLog((current) => [entry, ...current].slice(0, 10));
  }

  function handleIncrement() {
    setCount(count + 1);
    // Still the OLD value here – the new one only exists in the next render.
    write(`setCount(${count + 1}) called… but right after it, count is still ${count}`);
  }

  function handleBatch() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    write(`3 updates queued, count is still ${count}. React re-renders ONCE afterwards → ${count + 3}`);
  }

  function handleDelayed() {
    // The arrow function "remembers" the `count` of THIS render (a closure).
    const timerId = setTimeout(() => {
      write(`⏰ 3 s later the timeout says count = ${count} (even if you clicked +1 meanwhile)`);
    }, 3000);
    timers.current.push(timerId);
    write(`Timeout started while count = ${count}. Now click “+1” a few times quickly…`);
  }

  // Cancel any pending timeouts if the component unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <div className="grid-2">
      <div className="stack">
        <p className="state-big-number m-0">{count}</p>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={handleIncrement}>+1 and read count</button>
          <button type="button" className="btn" onClick={handleBatch}>+3 in one handler</button>
          <button type="button" className="btn btn-secondary" onClick={handleDelayed}>Read count in 3 s</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setCount(0); setLog([]); }}>Reset</button>
        </div>
        <pre className="demo-output">{`function handleIncrement() {
  setCount(count + 1);
  console.log(count); // 👈 old value!
}`}</pre>
      </div>

      <div className="stack-sm">
        <span className="label">Log (newest first)</span>
        <ol className="state-log">
          {log.length === 0 && <li className="subtle">Click a button…</li>}
          {log.map((entry) => <li key={entry.id}>{entry.message}</li>)}
        </ol>
      </div>
    </div>
  );
}
