/**
 * ToastPlayground – trying out the app-wide toast system.
 *
 * useToast() comes from src/context/ToastContext.jsx. The provider is wrapped
 * around the whole app in main.jsx, so ANY component can show a toast without
 * passing callbacks through props. showToast() returns the toast's id, which
 * we keep so we can dismiss it again with dismissToast(id).
 */
import { useId, useState } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';

const EXAMPLES = [
  { type: 'info', icon: Info, label: 'Info', title: 'Lecture moved', message: 'The Week 9 lecture is now in room ATC101.' },
  { type: 'success', icon: CircleCheck, label: 'Success', title: 'Submission received', message: 'Assignment 2 was uploaded successfully.' },
  { type: 'warning', icon: TriangleAlert, label: 'Warning', title: 'Due in 24 hours', message: 'Assignment 3 closes tomorrow at 23:59.' },
  { type: 'error', icon: CircleAlert, label: 'Error', title: 'Upload failed', message: 'The file is larger than the 10 MB limit.' },
];

export default function ToastPlayground() {
  const { showToast, dismissToast } = useToast();
  const [seconds, setSeconds] = useState(4);
  const [sticky, setSticky] = useState(false);
  const [lastId, setLastId] = useState(null);
  const sliderId = useId();

  function handleShow(example) {
    const id = showToast({
      type: example.type,
      title: example.title,
      message: example.message,
      duration: sticky ? 0 : seconds * 1000, // 0 = stays until the user closes it
    });
    setLastId(id);
  }

  return (
    <div className="stack">
      <div className="row">
        {EXAMPLES.map((example) => {
          const Icon = example.icon;
          return (
            <button key={example.type} type="button" className="btn" onClick={() => handleShow(example)}>
              <Icon size={16} aria-hidden="true" style={{ color: `var(--color-${example.type === 'error' ? 'danger' : example.type})` }} />
              {example.label}
            </button>
          );
        })}
      </div>

      <div className="row">
        <label htmlFor={sliderId} className="small">Duration: <strong>{seconds} s</strong></label>
        <input id={sliderId} type="range" min="1" max="10" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} disabled={sticky} />
        <label className="check small">
          <input type="checkbox" checked={sticky} onChange={(e) => setSticky(e.target.checked)} />
          Sticky (no auto-dismiss)
        </label>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => dismissToast(lastId)} disabled={lastId === null}>
          Dismiss last toast
        </button>
      </div>
      <p className="small muted m-0">Toasts appear in the bottom-right corner. They live in an aria-live region, so screen readers read them out.</p>
    </div>
  );
}
