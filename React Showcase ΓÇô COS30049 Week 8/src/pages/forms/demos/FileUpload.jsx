import { useEffect, useRef, useState } from 'react';
import { CloudUpload, FileText, X } from 'lucide-react';
import styles from './FileUpload.module.css';

/**
 * Drag-and-drop file upload with previews and validation.
 *
 * - Drop zone: onDragOver MUST call preventDefault(), otherwise the browser
 *   refuses the drop (and would open the file in the tab instead).
 * - A hidden <input type="file" multiple> handles "click to browse".
 * - Image previews use URL.createObjectURL(file) – a temporary local URL.
 *   It holds the file in memory until URL.revokeObjectURL() is called, so we
 *   create/revoke it in an effect with a cleanup function.
 */
const ACCEPTED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_FILES = 6;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function Thumbnail({ file }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file.type.startsWith('image/')) return undefined; // PDFs get an icon instead
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); // free the memory when removed/unmounted
  }, [file]);

  if (!file.type.startsWith('image/')) return <FileText size={28} aria-hidden="true" />;
  return url ? <img src={url} alt="" className={styles.thumbImg} /> : null;
}

export default function FileUpload() {
  const [files, setFiles] = useState([]); // [{ id, file }]
  const [rejected, setRejected] = useState([]); // ['name – reason']
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const accepted = [];
    const problems = [];
    for (const file of fileList) {
      const duplicate = [...files, ...accepted].some(({ file: f }) => f.name === file.name && f.size === file.size);
      if (!ACCEPTED.includes(file.type)) problems.push(`${file.name} – type not allowed`);
      else if (file.size > MAX_SIZE) problems.push(`${file.name} – larger than 2 MB`);
      else if (duplicate) problems.push(`${file.name} – already added`);
      else if (files.length + accepted.length >= MAX_FILES) problems.push(`${file.name} – max ${MAX_FILES} files`);
      else accepted.push({ id: crypto.randomUUID(), file });
    }
    setFiles((prev) => [...prev, ...accepted]);
    setRejected(problems);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleDragLeave(event) {
    // dragleave also fires when moving over a CHILD element – ignore those.
    if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
  }

  const totalSize = files.reduce((sum, { file }) => sum + file.size, 0);

  return (
    <div className="stack">
      <div
        className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUpload size={36} aria-hidden="true" />
        <p className="m-0"><strong>Drag & drop files here</strong> or</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current.click()}>
          Browse files…
        </button>
        <p className="hint m-0">PNG, JPG, GIF, WebP or PDF · max 2 MB each · up to {MAX_FILES} files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ''; // allow picking the same file again later
          }}
        />
      </div>

      {rejected.length > 0 && (
        <div className="alert alert-warning" role="alert">
          <ul className="m-0" style={{ paddingLeft: 18 }}>
            {rejected.map((msg) => <li key={msg}>{msg}</li>)}
          </ul>
        </div>
      )}

      {files.length > 0 && (
        <>
          <ul className={styles.list}>
            {files.map(({ id, file }) => (
              <li key={id} className={styles.item}>
                <span className={styles.thumb}><Thumbnail file={file} /></span>
                <span className={styles.meta}>
                  <strong className={styles.name}>{file.name}</strong>
                  <span className="small muted">{formatBytes(file.size)}</span>
                </span>
                <button type="button" className="btn-icon" aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((prev) => prev.filter((f) => f.id !== id))}>
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="row-between small">
            <span>{files.length} file(s) · total <strong>{formatBytes(totalSize)}</strong></span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFiles([]); setRejected([]); }}>
              Remove all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
