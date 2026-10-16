/**
 * ModalExamples – two ways of using the reusable <Modal> component.
 *
 * 1. An information dialog: just text and an "OK" button.
 * 2. A form inside a dialog. The submit button lives in the modal FOOTER, outside
 *    the <form>, so it is linked with the HTML form="…" attribute.
 *
 * Only ONE state value is needed: which modal is open ('info' | 'form' | null).
 */
import { useCallback, useId, useState } from 'react';
import { CalendarClock, Info } from 'lucide-react';
import Modal from './Modal.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

export default function ModalExamples() {
  const [openModal, setOpenModal] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const { showToast } = useToast();
  const formId = useId();

  // useCallback keeps the same function between renders, so Modal's effect
  // (which lists onClose as a dependency) does not re-run on every render.
  const close = useCallback(() => setOpenModal(null), []);

  function handleSubmit(event) {
    event.preventDefault();
    // FormData reads every named field of an uncontrolled form in one go.
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setLastRequest(data);
    close();
    showToast({ type: 'success', title: 'Request sent', message: `${data.assignment}: ${data.days} extra day(s) requested.` });
  }

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn" onClick={() => setOpenModal('info')}>
          <Info size={16} aria-hidden="true" /> Unit information
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setOpenModal('form')}>
          <CalendarClock size={16} aria-hidden="true" /> Request an extension
        </button>
      </div>
      <pre className="demo-output">
        {lastRequest ? JSON.stringify(lastRequest, null, 2) : 'Submit the extension form to see its data here.'}
      </pre>

      <Modal
        open={openModal === 'info'}
        onClose={close}
        title="COS30049 at a glance"
        footer={<button type="button" className="btn btn-primary" onClick={close} data-autofocus>Got it</button>}
      >
        <p>Computing Technology Innovation Project – 12.5 credit points, taught in Semester 2.</p>
        <ul>
          <li>Weekly lecture + 2-hour lab</li>
          <li>Three assignments, all completed in teams of 3–4</li>
          <li>No final exam</li>
        </ul>
        <p className="small muted">Try it: Tab cycles inside this dialog, Esc or a click on the dark backdrop closes it.</p>
      </Modal>

      <Modal
        open={openModal === 'form'}
        onClose={close}
        title="Request an extension"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
            <button type="submit" form={formId} className="btn btn-primary">Send request</button>
          </>
        }
      >
        <form id={formId} className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor={`${formId}-assignment`}>Assignment</label>
            <select id={`${formId}-assignment`} name="assignment" className="input" defaultValue="Assignment 3" data-autofocus>
              <option>Assignment 2</option>
              <option>Assignment 3</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor={`${formId}-days`}>Extra days (1–7)</label>
            <input id={`${formId}-days`} name="days" type="number" min="1" max="7" defaultValue="3" required className="input" />
          </div>
          <div className="field">
            <label className="label" htmlFor={`${formId}-reason`}>Reason <span className="required">*</span></label>
            <textarea id={`${formId}-reason`} name="reason" required minLength={20} className="input" placeholder="At least 20 characters…" />
            <p className="hint">The browser checks required / min / max / minLength before onSubmit runs.</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
