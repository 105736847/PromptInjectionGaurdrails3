/**
 * StudentBits.jsx – small presentational pieces shared by the demos on this page.
 * Pure components: props in, JSX out – no state, no requests.
 */
import { CircleAlert, RotateCcw, ServerOff } from 'lucide-react';
import { STATUSES } from './studentsApi.js';

const STATUS_BADGE = { active: 'badge-success', at_risk: 'badge-warning', graduated: 'badge-info' };
const GRADE_BADGE = { HD: 'badge-primary', D: 'badge-info', C: 'badge-success', P: 'badge', N: 'badge-danger' };

export function StatusBadge({ status }) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;
  return <span className={`badge ${STATUS_BADGE[status] ?? ''}`}>{label}</span>;
}

export function GradeBadge({ grade }) {
  return <span className={`badge ${GRADE_BADGE[grade] ?? ''} crud-grade`}>{grade}</span>;
}

/**
 * Shows an ApiError. Offline gets a friendlier hint than a raw network message.
 * onRetry → a "Try again" button (also for offline: the user may have just started the server).
 */
export function RequestError({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-danger" role="alert">
      {error.isOffline ? <ServerOff size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}
      <div>
        {error.isOffline ? (
          <>
            <strong>The back end is not reachable.</strong> Start the back end – see the banner above.
          </>
        ) : (
          <>
            <strong>{error.status ? `${error.status} – ` : ''}</strong>
            {error.message}
          </>
        )}
        {onRetry && (
          <div className="mt-1">
            <button type="button" className="btn btn-sm" onClick={onRetry}>
              <RotateCcw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** HTTP status → the reason phrase shown in the response panels. */
export const STATUS_TEXT = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Content',
  500: 'Internal Server Error',
};

/** { first_name: 'Ada', last_name: 'Lovelace' } → "Ada Lovelace" (for messages). */
export function fullName(student) {
  return `${student.first_name} ${student.last_name}`;
}
