/**
 * authUtils.js – small formatting helpers shared by the Login & JWT demos.
 */

/** Seconds → "4:05" or "1:02:03" for countdowns. */
export function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Whole seconds from `now` until `timeMs` (both in milliseconds), never below 0.
 * Every countdown on the page uses this ONE rule (round UP: "0:01" until it really
 * is over), so two clocks side by side never disagree.
 */
export function secondsUntil(timeMs, now) {
  return Math.max(0, Math.ceil((timeMs - now) / 1000));
}

/** "Dr Sam Lecturer" → "SL" (first letters of the last two words). */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** A readable message for any error thrown by src/api/client.js. */
export function errorText(error) {
  if (error?.isOffline) return 'The back end is not reachable – start it (see the banner at the top of the page).';
  return error?.message ?? 'Something went wrong.';
}

/** Show the start and end of a long token, e.g. "eyJhbGciOi…Tccjao". */
export function shortToken(token, keep = 12) {
  if (!token) return '';
  return token.length <= keep * 2 + 1 ? token : `${token.slice(0, keep)}…${token.slice(-6)}`;
}

/**
 * FastAPI's 422 messages from a Python `ValueError` start with "Value error, ".
 * Drop that prefix before showing the message next to a form field.
 */
export function cleanFieldErrors(fieldErrors) {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, message]) => [field, message.replace(/^Value error, /, '')]),
  );
}
