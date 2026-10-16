/**
 * FileUploader – drag & drop (or browse for) files and upload them with a REAL progress bar.
 *
 * Teaches: a drop zone (onDragOver + onDrop), <input type="file" multiple>, quick checks in
 * the browser, XMLHttpRequest upload progress, cancelling with AbortController, and telling a
 * sibling component to reload (the `reloadKey` counter).
 *
 * The browser checks are only for a FAST, friendly answer. Anyone can skip them (tick the box!),
 * so the server must check everything again – watch it answer 413 and 415.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { CloudUpload, X } from 'lucide-react';
import { uploadWithProgress } from './uploadWithProgress.js';
import UploadedFiles from './UploadedFiles.jsx';
import { formatBytes } from './format.js';
import { makeLargeCsv, makeStudentCsv } from './data/sampleCsv.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['.csv', '.txt', '.png', '.jpg', '.jpeg', '.pdf'];

function checkInBrowser(file) {
  const dot = file.name.lastIndexOf('.');
  const extension = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
  if (!extension) return 'The file name needs an extension such as .csv.';
  if (!ALLOWED.includes(extension)) return `${extension} files are not allowed.`;
  if (file.size > MAX_BYTES) return `${formatBytes(file.size)} is over the 5 MB limit.`;
  return null;
}

// Test files made in the browser – handy in a lecture.
const SAMPLES = [
  { label: 'marks.csv', make: () => new File([makeStudentCsv()], 'marks.csv', { type: 'text/csv' }) },
  { label: '4 MB CSV', make: () => new File([makeLargeCsv(4)], 'big-dataset.csv', { type: 'text/csv' }) },
  { label: '6 MB CSV (too big)', make: () => new File([makeLargeCsv(6)], 'too-big.csv', { type: 'text/csv' }) },
  { label: 'setup.exe (wrong type)', make: () => new File(['MZ fake program'], 'setup.exe') },
  { label: 'fake.png (text inside)', make: () => new File(['I am not a picture'], 'fake.png', { type: 'image/png' }) },
];

const STATUS_TEXT = { done: 'Uploaded ✓', cancelled: 'Cancelled' };
const BAR_CLASS = { done: ' is-done', error: ' is-error', rejected: ' is-error', cancelled: ' is-muted' };

export default function FileUploader() {
  const [uploads, setUploads] = useState([]); // { key, name, size, status, progress, error }
  const [dragging, setDragging] = useState(false);
  const [skipChecks, setSkipChecks] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [announcement, setAnnouncement] = useState(''); // the latest outcome, for screen readers
  // Refs, not state: changing these must not re-render anything.
  const controllers = useRef(new Map()); // upload key → its AbortController
  const nextKey = useRef(1);
  const inputId = useId();

  // Leaving the page cancels every upload that is still running.
  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((controller) => controller.abort());
  }, []);

  const update = (key, changes) =>
    setUploads((list) => list.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  async function upload(file) {
    const key = nextKey.current++;
    const problem = skipChecks ? null : checkInBrowser(file);
    const item = { key, name: file.name, size: file.size, progress: 0, error: problem };
    setUploads((list) => [{ ...item, status: problem ? 'rejected' : 'uploading' }, ...list]);
    if (problem) {
      setAnnouncement(`${file.name} not sent: ${problem}`);
      return; // don't waste the network on a file we know is wrong
    }

    const controller = new AbortController();
    controllers.current.set(key, controller);
    try {
      await uploadWithProgress([file], { signal: controller.signal, onProgress: (progress) => update(key, { progress }) });
      update(key, { status: 'done', progress: 100 });
      setAnnouncement(`${file.name} uploaded.`);
      setReloadKey((n) => n + 1); // → <UploadedFiles> fetches the list again
    } catch (error) {
      const message = error.name === 'AbortError' ? null
        : error.isOffline ? 'Start the back end – see the banner above.'
        : `Server said ${error.status} – ${error.message}`;
      update(key, message ? { status: 'error', error: message } : { status: 'cancelled' });
      setAnnouncement(`${file.name}: ${message ?? 'upload cancelled.'}`);
    } finally {
      controllers.current.delete(key);
    }
  }

  const addFiles = (fileList) => Array.from(fileList).forEach(upload);

  return (
    <div className="stack">
      <div
        className={`rt-dropzone${dragging ? ' is-dragging' : ''}`}
        // preventDefault() on dragover says "you may drop here" – otherwise the browser opens the file.
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        // dragleave also fires when moving over a child element – only react when really leaving.
        onDragLeave={(event) => !event.currentTarget.contains(event.relatedTarget) && setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
      >
        <CloudUpload size={30} aria-hidden="true" />
        <p><strong>Drag &amp; drop files here</strong> or</p>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          multiple
          accept={skipChecks ? undefined : ALLOWED.join(',')}
          // Reset the value so choosing the same file twice still fires onChange.
          onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }}
        />
        <label htmlFor={inputId} className="btn btn-secondary btn-sm">Browse…</label>
        <p className="small">CSV, TXT, PNG, JPG or PDF · max 5 MB each</p>
      </div>

      <div className="rt-samples small">
        <span className="muted">Try a test file:</span>
        {SAMPLES.map((sample) => (
          <button key={sample.label} type="button" className="btn btn-sm" onClick={() => upload(sample.make())}>
            {sample.label}
          </button>
        ))}
      </div>
      <label className="switch small">
        <input type="checkbox" checked={skipChecks} onChange={(e) => setSkipChecks(e.target.checked)} />
        <span className="switch-track" /> Skip the browser checks (see what the server says)
      </label>
      {/* One live region, present from the start: screen readers hear each result once
          (not every progress step). Sighted users see the same result in the list below. */}
      <p className="visually-hidden" role="status">{announcement}</p>

      {uploads.length > 0 && (
        <div className="row-between">
          <h4 className="m-0">This session’s uploads</h4>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUploads((list) => list.filter((i) => i.status === 'uploading'))}>
            Clear list
          </button>
        </div>
      )}
      {uploads.length > 0 && (
        <ul className="rt-uploads" aria-label="Uploads">
          {uploads.map((item) => (
            <li key={item.key} className="rt-upload">
              <div className="row-between">
                <span className="rt-file-name">{item.name}</span>
                <span className="muted small">{formatBytes(item.size)}</span>
              </div>
              <div
                className={`rt-progress${BAR_CLASS[item.status] ?? ''}`}
                role="progressbar" aria-label={`Upload of ${item.name}`}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress}
              >
                <span style={{ width: `${item.error ? 100 : item.progress}%` }} />
              </div>
              <div className="rt-upload-status">
                {item.status === 'uploading' ? <span>{item.progress}% sent…</span>
                  : item.error ? <span className="error-text">{item.status === 'rejected' && 'Not sent: '}{item.error}</span>
                  : <span className="muted">{STATUS_TEXT[item.status]}</span>}
                {item.status === 'uploading' && (
                  <button type="button" className="btn btn-sm" onClick={() => controllers.current.get(item.key)?.abort()}>
                    <X size={14} aria-hidden="true" /> Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <UploadedFiles reloadKey={reloadKey} />
    </div>
  );
}
