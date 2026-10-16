/**
 * uploadWithProgress – POST files to FastAPI and report how much has been SENT.
 *
 *   const saved = await uploadWithProgress([file], { onProgress: (percent) => …, signal });
 *
 * Why XMLHttpRequest and not fetch()? fetch() can read a *response* bit by bit (download
 * progress), but browsers give it no event for how much of the *request body* has left the
 * computer. XMLHttpRequest has had `xhr.upload.onprogress` for years – so for upload
 * progress bars, the "old" API is still the right tool.
 */
import { API_BASE, ApiError } from '../../../api/client.js';

const OFFLINE = 'Cannot reach the FastAPI back end. Is it running on port 8000?';

/** FastAPI's "detail" is a string, or a list of validation errors (422). */
function messageFrom(status, detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join('; ');
  return `Upload failed with status ${status}`;
}

export function uploadWithProgress(files, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    // multipart/form-data: the field name must match the FastAPI parameter `files`.
    const form = new FormData();
    for (const file of files) form.append('files', file);

    const url = `${API_BASE}/api/files`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'json'; // parse the answer for us

    // Fires again and again while the body is being sent.
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.response);
      // The Vite dev proxy answers a bare 5xx (no JSON) when FastAPI isn't running.
      if (xhr.status >= 500 && !xhr.response) return reject(new ApiError(OFFLINE, { url }));
      const detail = xhr.response?.detail ?? null;
      reject(new ApiError(messageFrom(xhr.status, detail), { status: xhr.status, detail, url }));
    };
    xhr.onerror = () => reject(new ApiError(OFFLINE, { url })); // network error: nothing answered
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));

    // Support AbortController, exactly like fetch({ signal }) does.
    if (signal?.aborted) return reject(new DOMException('Upload cancelled', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    xhr.send(form); // the browser sets Content-Type (with the multipart boundary) itself
  });
}
