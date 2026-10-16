/**
 * ConfirmDelete – using the async confirm() from useConfirm.jsx.
 *
 * Read handleDelete() top to bottom: it looks like synchronous code, but
 * `await confirm(…)` pauses the function until the user answers the dialog.
 * Compare it with the browser's built-in window.confirm(), which blocks the
 * whole page and cannot be styled.
 */
import { useState } from 'react';
import { FileText, RotateCcw, Trash2 } from 'lucide-react';
import useConfirm from './useConfirm.jsx';

const INITIAL_FILES = [
  { id: 1, name: 'assignment2-report.pdf', size: '1.2 MB' },
  { id: 2, name: 'model-notebook.ipynb', size: '640 KB' },
  { id: 3, name: 'frontend-demo.mp4', size: '48 MB' },
];

export default function ConfirmDelete() {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [log, setLog] = useState([]);
  const [confirm, confirmDialog] = useConfirm();

  const addLog = (line) => setLog((current) => [line, ...current].slice(0, 4));

  async function handleDelete(file) {
    const ok = await confirm({
      title: 'Delete submission?',
      message: `“${file.name}” will be permanently removed from your submissions. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    addLog(`confirm() resolved to ${ok} for ${file.name}`);
    if (ok) setFiles((current) => current.filter((f) => f.id !== file.id));
  }

  function handleNativeConfirm() {
    const ok = window.confirm('Delete all files? (This is the browser’s built-in dialog.)');
    addLog(`window.confirm() returned ${ok}`);
  }

  return (
    <div className="stack">
      <ul className="stack-sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {files.map((file) => (
          <li key={file.id} className="card row-between" style={{ padding: '10px 14px' }}>
            <span className="row">
              <FileText size={18} aria-hidden="true" />
              <span className="mono small">{file.name}</span>
              <span className="badge">{file.size}</span>
            </span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => handleDelete(file)} aria-label={`Delete ${file.name}`}>
              <Trash2 size={15} aria-hidden="true" /> Delete
            </button>
          </li>
        ))}
        {files.length === 0 && <li className="muted small">No submissions left.</li>}
      </ul>

      <div className="row">
        <button type="button" className="btn btn-sm" onClick={handleNativeConfirm}>
          Compare: window.confirm()
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setFiles(INITIAL_FILES)} disabled={files.length === INITIAL_FILES.length}>
          <RotateCcw size={14} aria-hidden="true" /> Restore files
        </button>
      </div>
      <pre className="demo-output" aria-live="polite">{log.length ? log.join('\n') : 'Log: nothing yet'}</pre>

      {confirmDialog}
    </div>
  );
}
