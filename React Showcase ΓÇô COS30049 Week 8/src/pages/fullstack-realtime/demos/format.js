/** format.js – tiny display helpers shared by the demos on this page. */

/** 1536 → "1.5 KB", 5242880 → "5.0 MB" */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** An ISO date string from the server → "14:03:27" in the viewer's own time zone. */
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
