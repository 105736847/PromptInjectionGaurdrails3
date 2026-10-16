/**
 * MemoCallback – React.memo + useCallback working together.
 *
 * By default, when a parent re-renders, ALL of its children re-render too.
 *   memo(Component)   → skip re-rendering if every prop is the same (===) as last time
 *   useCallback(fn, deps) → keep the SAME function object between renders
 *
 * memo alone is not enough when you pass a function: an arrow function
 * written in the parent is a brand-new object on every render, so the
 * props are "different" and memo re-renders anyway.
 *
 * Don't sprinkle memo everywhere – use it when a child is slow to render.
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// A tiny custom hook: counts commits and writes the number straight into a DOM node,
// so counting renders never causes an extra render.
function useRenderCount() {
  const count = useRef(0);
  const elementRef = useRef(null);
  useEffect(() => {
    count.current += 1;
    elementRef.current.textContent = count.current;
  });
  return elementRef;
}

function ChildCard({ title, note, onPick }) {
  const renderCountRef = useRenderCount();
  return (
    <div className="card stack-sm">
      <strong>{title}</strong>
      <span className="small muted">{note}</span>
      <span>
        Renders: <strong className="hooks-render-count" ref={renderCountRef} />
      </span>
      <button type="button" className="btn btn-sm" onClick={() => onPick(title)}>
        Pick me
      </button>
    </div>
  );
}

// Same component, wrapped in memo().
const MemoChildCard = memo(ChildCard);

export default function MemoCallback() {
  const [count, setCount] = useState(0);
  const [picked, setPicked] = useState('nobody yet');

  // ❌ A NEW function every time MemoCallback renders.
  const handlePickInline = (name) => setPicked(name);

  // ✅ The SAME function every render (setPicked never changes, so no dependencies).
  const handlePickStable = useCallback((name) => setPicked(name), []);

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={() => setCount((c) => c + 1)}>
          <RefreshCw size={16} /> Re-render the parent
        </button>
        <span className="small muted">parent count = {count} · picked = {picked}</span>
      </div>

      <div className="grid-3">
        <ChildCard title="Plain child" note="No memo → re-renders every time its parent does." onPick={handlePickStable} />
        <MemoChildCard title="memo + inline function" note="memo, but onPick is a new function each render → memo can't help."
          onPick={handlePickInline} />
        <MemoChildCard title="memo + useCallback" note="memo AND a stable onPick → skips the re-render."
          onPick={handlePickStable} />
      </div>

      <p className="hint">
        Click “Re-render the parent” a few times and compare the counters. (In development every counter starts at 2:
        StrictMode runs effects twice when a component first mounts.)
      </p>
    </div>
  );
}
