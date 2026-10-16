/**
 * ApiErrorNote – one consistent way to show a failed request on this page.
 *   offline (no back end)  → a friendly "start the server" hint
 *   any other ApiError     → the HTTP status + FastAPI's own message
 *
 * `fillsIn`: demos that load by themselves (they re-run when the shared health check
 * says "online") promise to fill themselves in; demos started by a button say "try again".
 */
import { CircleAlert, ServerOff } from 'lucide-react';

export default function ApiErrorNote({ error, offline = false, fillsIn = true }) {
  if (offline || error?.isOffline) {
    return (
      <div className="alert alert-warning" role="alert">
        <ServerOff size={18} aria-hidden="true" />
        <div>
          Start the back end – see the banner above – and{' '}
          {fillsIn ? 'this example will fill itself in.' : 'then press the button again.'}
        </div>
      </div>
    );
  }
  if (!error) return null;
  return (
    <div className="alert alert-danger" role="alert">
      <CircleAlert size={18} aria-hidden="true" />
      <div>
        <strong>{error.status ? `HTTP ${error.status}` : 'Request failed'}</strong> – {error.message}
      </div>
    </div>
  );
}
