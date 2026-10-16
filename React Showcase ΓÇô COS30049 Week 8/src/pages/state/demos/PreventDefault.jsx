/**
 * PreventDefault – stopping the BROWSER's built-in behaviour.
 *
 * Some elements do something on their own: a link navigates, a form submits
 * and reloads the page, a key types a character. event.preventDefault()
 * cancels that default action so your React code can decide what happens.
 *
 * (Not the same as stopPropagation, which stops OTHER HANDLERS from hearing the event.)
 */
import { useId, useState } from 'react';

export default function PreventDefault() {
  const [blockLink, setBlockLink] = useState(true);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const id = useId();

  function handleLinkClick(event) {
    if (blockLink) {
      event.preventDefault(); // the browser will NOT open the link
      setMessage('Link click intercepted – no navigation happened.');
    } else {
      setMessage('Default allowed – the link opened in a new tab.');
    }
  }

  function handleSubmit(event) {
    event.preventDefault(); // without this the whole page would reload and all state would be lost!
    // FormData reads every named field of the form in one go.
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSubmitted(data);
  }

  function handleKeyDown(event) {
    // Block digits: the key press is cancelled, so the character never appears.
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      setMessage(`Blocked the key "${event.key}" – names can't contain digits.`);
    }
  }

  return (
    <div className="grid-2">
      <div className="stack">
        <div className="card stack-sm">
          <h4 className="m-0">1. A link</h4>
          <label className="check">
            <input type="checkbox" checked={blockLink} onChange={(e) => setBlockLink(e.target.checked)} />
            <span>call <code>e.preventDefault()</code></span>
          </label>
          <a href="https://react.dev/learn/responding-to-events" target="_blank" rel="noreferrer" onClick={handleLinkClick}>
            Open “Responding to Events” on react.dev
          </a>
        </div>

        <form className="card stack-sm" onSubmit={handleSubmit}>
          <h4 className="m-0">2. A form</h4>
          <div className="field">
            <label className="label" htmlFor={`${id}-name`}>Preferred name (digits are blocked)</label>
            <input id={`${id}-name`} name="preferredName" className="input" defaultValue="Mia"
              onKeyDown={handleKeyDown} />
          </div>
          <div className="field">
            <label className="label" htmlFor={`${id}-unit`}>Unit code</label>
            <input id={`${id}-unit`} name="unitCode" className="input" defaultValue="COS30049" />
          </div>
          <button type="submit" className="btn btn-primary">Submit (no reload)</button>
        </form>
      </div>

      <div className="stack-sm">
        <span className="label">What happened</span>
        <pre className="demo-output" aria-live="polite">
          {message || 'Click the link, type a digit into the name field, or submit the form.'}
        </pre>
        <span className="label">Submitted form data</span>
        <pre className="demo-output">{submitted ? JSON.stringify(submitted, null, 2) : '(nothing yet)'}</pre>
      </div>
    </div>
  );
}
