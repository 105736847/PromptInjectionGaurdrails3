/**
 * ConnectionPill – a small coloured badge showing the state of a live connection.
 *
 *   <ConnectionPill status="reconnecting" detail="in 2 s" />
 */
const LABELS = {
  connecting: 'Connecting…',
  open: 'Connected',
  reconnecting: 'Reconnecting',
  closed: 'Disconnected',
  paused: 'Paused',
};

export default function ConnectionPill({ status, detail }) {
  return (
    // role="status" → screen readers announce changes politely
    <span className={`rt-pill rt-pill-${status}`} role="status">
      <span className="rt-pill-dot" aria-hidden="true" />
      {LABELS[status] ?? status}
      {detail && <span className="rt-pill-detail">{detail}</span>}
    </span>
  );
}
