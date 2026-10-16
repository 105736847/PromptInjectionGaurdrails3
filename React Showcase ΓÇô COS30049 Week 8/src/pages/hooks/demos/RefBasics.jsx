/**
 * RefBasics – useRef gives you a box `{ current: … }` that React keeps
 * between renders. Two very different uses:
 *
 *   1. Grab a DOM element:   <input ref={inputRef} />  →  inputRef.current.focus()
 *   2. Remember a value WITHOUT re-rendering when it changes
 *      (render counters, timer ids, the previous value…)
 *
 * State vs ref: changing state re-renders the component; changing
 * ref.current does NOT – React doesn't even notice.
 */
import { useEffect, useId, useRef, useState } from 'react';

export default function RefBasics() {
  const id = useId();

  // 1. DOM ref
  const inputRef = useRef(null);

  // 2. Remember the previous value: update the ref just BEFORE setting the new state.
  const [score, setScore] = useState(50);
  const previousScore = useRef(null);

  function handleScoreChange(event) {
    previousScore.current = score; // the value we're about to replace
    setScore(Number(event.target.value));
  }

  // 3a. Count renders without causing renders.
  const renderCount = useRef(0);
  const renderCountEl = useRef(null);
  useEffect(() => {
    renderCount.current += 1; // no dependency array → after every render
    renderCountEl.current.textContent = renderCount.current; // write to the DOM directly
  });

  // 3b. A click counter kept in a ref vs one kept in state.
  const refClicks = useRef(0);
  const [stateClicks, setStateClicks] = useState(0);
  const [shownRefClicks, setShownRefClicks] = useState(null);

  return (
    <div className="grid-2">
      <div className="stack">
        <h4 className="m-0">1. Reach into the DOM</h4>
        <input ref={inputRef} className="input" defaultValue="COS30049 – Computing Technology Innovation Project"
          aria-label="Unit name" />
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => inputRef.current.focus()}>Focus</button>
          <button type="button" className="btn btn-sm" onClick={() => inputRef.current.select()}>Select all</button>
          <button type="button" className="btn btn-sm" onClick={() => { inputRef.current.value = ''; inputRef.current.focus(); }}>
            Clear &amp; focus
          </button>
        </div>

        <h4 className="m-0 mt-1">2. Remember the previous value</h4>
        <label className="label" htmlFor={id}>Your score: {score}</label>
        <input id={id} type="range" min={0} max={100} value={score} onChange={handleScoreChange} />
        <p className="small m-0">
          Previous: <strong>{previousScore.current ?? '—'}</strong> → now <strong>{score}</strong>
        </p>
      </div>

      <div className="stack">
        <h4 className="m-0">3. Ref vs state</h4>
        <p className="m-0">
          This component has rendered <strong className="hooks-render-count" ref={renderCountEl} /> times.
        </p>
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => { refClicks.current += 1; }}>
            ref +1 (silent)
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setStateClicks((c) => c + 1)}>
            state +1 (re-renders)
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShownRefClicks(refClicks.current)}>
            Read the ref
          </button>
        </div>
        <ul className="small m-0">
          <li>State clicks on screen: <strong>{stateClicks}</strong></li>
          <li>Ref clicks (last time you pressed “Read the ref”): <strong>{shownRefClicks ?? '—'}</strong></li>
        </ul>
        <p className="hint">
          Click “ref +1” a few times: the render count doesn’t move. In development the count starts at 2 because
          StrictMode runs effects twice when a component mounts.
        </p>
      </div>
    </div>
  );
}
