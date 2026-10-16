/**
 * NativeDialog – the built-in HTML <dialog> element, driven from React with a ref.
 *
 * - React has no "open this dialog as a modal" prop, so we call the DOM method
 *   dialogRef.current.showModal() directly. (Rendering <dialog open> would show
 *   it as a NON-modal dialog.)
 * - The browser then provides: the top layer (no z-index fights), a ::backdrop,
 *   an inert page behind it, Esc to close, and focus returning to the opener.
 * - <form method="dialog"> closes the dialog on submit and puts the clicked
 *   button's value into dialog.returnValue, which we read in onClose.
 */
import { useId, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import styles from './NativeDialog.module.css';

export default function NativeDialog() {
  const dialogRef = useRef(null);
  const [result, setResult] = useState(null);
  const titleId = useId();

  function openDialog() {
    dialogRef.current.returnValue = ''; // clear the answer from last time
    dialogRef.current.showModal();
  }

  function handleClose(event) {
    // returnValue is '' when closed with Esc (the "cancel" event)
    setResult(event.currentTarget.returnValue || 'dismissed');
  }

  function handleClick(event) {
    // A click on the ::backdrop is reported as a click on the <dialog> itself.
    if (event.target === event.currentTarget) event.currentTarget.close('dismissed');
  }

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={openDialog}>
          <Users size={16} aria-hidden="true" /> Open native &lt;dialog&gt;
        </button>
        <span className="small muted" aria-live="polite">
          Last answer: <code>{result ?? 'none yet'}</code>
        </span>
      </div>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onClose={handleClose} onClick={handleClick}>
        <form method="dialog" className={styles.content}>
          <h3 id={titleId} className="m-0">Join the COS30049 study group?</h3>
          <p className="muted m-0">We meet every Thursday at 4 pm in the library, level 3, to work through the lab exercises together.</p>
          <div className={styles.actions}>
            <button type="submit" value="declined" className="btn btn-ghost">Not now</button>
            <button type="submit" value="joined" className="btn btn-primary">Join group</button>
          </div>
        </form>
      </dialog>

      <div className="table-wrap">
        <table className="table">
          <caption>Custom &lt;Modal&gt; vs native &lt;dialog&gt;</caption>
          <thead>
            <tr><th>Feature</th><th>Custom (Modal.jsx)</th><th>Native &lt;dialog&gt;</th></tr>
          </thead>
          <tbody>
            <tr><td>Focus trap + return</td><td>useFocusTrap hook</td><td>Built in</td></tr>
            <tr><td>Esc to close</td><td>keydown listener</td><td>Built in (cancel event)</td></tr>
            <tr><td>Above everything</td><td>createPortal + z-index</td><td>Top layer</td></tr>
            <tr><td>Backdrop</td><td>A &lt;div&gt;</td><td>::backdrop pseudo-element</td></tr>
            <tr><td>Scroll lock</td><td>body overflow: hidden</td><td>Not built in</td></tr>
            <tr><td>Open / close</td><td>React state (open prop)</td><td>showModal() / close() via a ref</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
