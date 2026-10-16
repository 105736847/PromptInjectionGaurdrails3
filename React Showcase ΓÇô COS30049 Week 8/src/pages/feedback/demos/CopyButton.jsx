/**
 * CopyButton – copy text to the clipboard with "Copied!" feedback.
 *
 * - navigator.clipboard.writeText() returns a Promise, so we use async/await
 *   and try/catch (it can fail, e.g. on http:// pages or if permission is denied).
 * - The "Copied!" state resets itself after 2 s with a timer in useEffect;
 *   the cleanup cancels the timer if the component unmounts first.
 * - A visually hidden live region announces the result to screen readers.
 */
import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

function CopyButton({ text, label }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'copied' | 'failed'

  useEffect(() => {
    if (status === 'idle') return undefined;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <>
      <button type="button" className={`btn btn-sm ${status === 'copied' ? 'btn-success' : ''}`} onClick={handleCopy} aria-label={`Copy ${label}`}>
        {status === 'copied' && <><Check size={14} aria-hidden="true" /> Copied!</>}
        {status === 'failed' && <><X size={14} aria-hidden="true" /> Failed</>}
        {status === 'idle' && <><Copy size={14} aria-hidden="true" /> Copy</>}
      </button>
      <span className="visually-hidden" role="status">
        {status === 'copied' ? `${label} copied to clipboard` : status === 'failed' ? 'Copy failed' : ''}
      </span>
    </>
  );
}

const FIELDS = [
  { label: 'Student ID', value: '104338601' },
  { label: 'Lab Zoom link', value: 'https://example.edu/zoom/cos30049-lab3' },
  { label: 'Create command', value: 'npm create vite@latest my-app -- --template react' },
];

export default function CopyFields() {
  return (
    <dl className="stack-sm m-0">
      {FIELDS.map((field) => (
        <div key={field.label} className="row" style={{ flexWrap: 'nowrap' }}>
          <dt className="small muted" style={{ width: 110, flexShrink: 0 }}>{field.label}</dt>
          <dd className="m-0 row" style={{ flex: 1, minWidth: 0, flexWrap: 'nowrap' }}>
            <code style={{ flex: 1, minWidth: 0, overflowX: 'auto', whiteSpace: 'nowrap' }}>{field.value}</code>
            <CopyButton text={field.value} label={field.label} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
