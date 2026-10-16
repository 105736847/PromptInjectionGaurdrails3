/**
 * EventPropagation – events "bubble" UP the tree.
 *
 * Click the inner button: its onClick runs first, then the middle box's,
 * then the outer box's – each parent hears the click too.
 *
 * - event.target        = the element that was actually clicked (never changes)
 * - event.currentTarget = the element whose handler is running right now
 * - event.stopPropagation() = "don't tell my parents about this click"
 * - onClickCapture runs on the way DOWN, before any onClick (rarely needed)
 */
import { useState } from 'react';

export default function EventPropagation() {
  const [stopAtInner, setStopAtInner] = useState(false);
  const [stopAtMiddle, setStopAtMiddle] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  // One "trace" per click: every handler for the same click shares the same event.timeStamp.
  const [trace, setTrace] = useState({ stamp: null, steps: [] });

  function record(event, phase) {
    const step = {
      phase,
      handler: event.currentTarget.dataset.name,
      target: event.target.dataset.name ?? event.target.closest('[data-name]')?.dataset.name,
    };
    setTrace((current) =>
      current.stamp === event.timeStamp
        ? { stamp: current.stamp, steps: [...current.steps, step] } // same click → append
        : { stamp: event.timeStamp, steps: [step] }, // new click → start a new trace
    );
  }

  // Build the handler props for one box. Capture handlers are only added when the checkbox is on.
  function handlersFor(stop) {
    return {
      onClick: (event) => {
        record(event, 'bubble');
        if (stop) event.stopPropagation();
      },
      onClickCapture: showCapture ? (event) => record(event, 'capture') : undefined,
    };
  }

  return (
    <div className="grid-2">
      <div className="stack">
        <div className="state-bubble state-bubble-outer" data-name="Outer" {...handlersFor(false)}>
          <span className="state-bubble-label">Outer &lt;div&gt;</span>
          <div className="state-bubble state-bubble-middle" data-name="Middle" {...handlersFor(stopAtMiddle)}>
            <span className="state-bubble-label">Middle &lt;div&gt;</span>
            <button type="button" className="btn btn-primary" data-name="Inner" {...handlersFor(stopAtInner)}>
              Inner &lt;button&gt; – click me
            </button>
          </div>
        </div>

        <div className="stack-sm">
          <label className="check">
            <input type="checkbox" checked={stopAtInner} onChange={(e) => setStopAtInner(e.target.checked)} />
            <span>Inner calls <code>e.stopPropagation()</code></span>
          </label>
          <label className="check">
            <input type="checkbox" checked={stopAtMiddle} onChange={(e) => setStopAtMiddle(e.target.checked)} />
            <span>Middle calls <code>e.stopPropagation()</code></span>
          </label>
          <label className="check">
            <input type="checkbox" checked={showCapture} onChange={(e) => setShowCapture(e.target.checked)} />
            <span>Also listen in the capture phase (<code>onClickCapture</code>)</span>
          </label>
        </div>
      </div>

      <div className="stack-sm">
        <span className="label">Handlers that ran for the last click (in order)</span>
        {trace.steps.length === 0 ? (
          <p className="state-log subtle">Click the button or one of the boxes…</p>
        ) : (
          <ol className="state-log state-log-numbered">
            {trace.steps.map((step, index) => (
              // index is fine as a key here: the list is rebuilt from scratch and never reordered
              <li key={index}>
                <span className={`badge ${step.phase === 'capture' ? 'badge-info' : 'badge-primary'}`}>
                  {step.phase === 'capture' ? '↓ capture' : '↑ bubble'}
                </span>{' '}
                <strong>{step.handler}</strong> handler · target = {step.target}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
