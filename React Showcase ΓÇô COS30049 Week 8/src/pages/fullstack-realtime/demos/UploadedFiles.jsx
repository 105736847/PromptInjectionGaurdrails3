/**
 * UploadedFiles – what is stored on the server: GET /api/files, download links, DELETE.
 *
 * The effect depends on `reloadKey`: whenever the uploader bumps that number, React runs the
 * effect again and we fetch a fresh list. The cleanup aborts a request that is still running,
 * so a slow old answer can never overwrite a newer one.
 */
import { useEffect, useId, useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import { api, API_BASE } from '../../../api/client.js';
import { formatBytes, formatTime } from './format.js';

// Types a browser can show in a tab. (For ?inline=true the server sends a CSV as text/plain –
// browsers would download text/csv instead of showing it.)
const VIEWABLE = new Set(['image/png', 'image/jpeg', 'application/pdf', 'text/plain', 'text/csv']);

export default function UploadedFiles({ reloadKey }) {
  const [files, setFiles] = useState(null); // null = not loaded yet
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const titleId = useId();

  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/api/files', { signal: controller.signal })
      .then((list) => {
        setFiles(list);
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err);
      });
    return () => controller.abort();
  }, [reloadKey]);

  async function remove(file) {
    setDeletingId(file.id);
    try {
      await api.delete(`/api/files/${file.id}`); // 204 No Content
      setFiles((list) => list.filter((f) => f.id !== file.id));
    } catch (err) {
      setError(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="stack-sm" aria-labelledby={titleId}>
      <h4 id={titleId} className="m-0">Stored on the server</h4>
      {error && (
        <p className="error-text" role="alert">
          {error.isOffline ? 'Start the back end – see the banner above.' : error.message}
        </p>
      )}
      {files === null && !error && <p className="muted small m-0"><span className="spinner" aria-hidden="true" /> Loading…</p>}
      {files?.length === 0 && <p className="muted small m-0">No files yet – upload one above.</p>}
      {files?.length > 0 && (
        <div className="table-wrap">
          <table className="table rt-files">
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="rt-files-name">{file.name}</span>
                    <span className="rt-files-meta">{formatBytes(file.size)} · uploaded {formatTime(file.uploaded_at)}</span>
                  </td>
                  <td>
                    <div className="rt-actions">
                      {VIEWABLE.has(file.content_type) && (
                        <a className="btn-icon" href={`${API_BASE}${file.url}?inline=true`} target="_blank" rel="noreferrer"
                          aria-label={`Open ${file.name}`} title="Open in a new tab">
                          <Eye size={16} aria-hidden="true" />
                        </a>
                      )}
                      {/* A plain link is enough: the server's Content-Disposition header makes it a download. */}
                      <a className="btn-icon" href={`${API_BASE}${file.url}`} aria-label={`Download ${file.name}`} title="Download">
                        <Download size={16} aria-hidden="true" />
                      </a>
                      <button type="button" className="btn-icon" onClick={() => remove(file)} disabled={deletingId === file.id}
                        aria-label={`Delete ${file.name}`} title="Delete">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
