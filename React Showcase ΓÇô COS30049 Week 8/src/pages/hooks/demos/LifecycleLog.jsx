/**
 * LifecycleLog – mount → update → unmount, seen from inside a component.
 *
 * <ProfileBadge> reports what happens to it into a log that belongs to the
 * PARENT (so the log survives when the badge is removed):
 *
 *   MOUNT    useEffect(…, [])  runs once after the badge first appears
 *   UPDATE   an effect compares the new props with the previous ones (kept in a ref)
 *   CLEANUP  the function returned by an effect runs before it re-runs…
 *   UNMOUNT  …and one last time when the component is removed
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const NAMES = ['Mia', 'Liam', 'Aisha', 'Noah'];
const COLOURS = ['primary', 'success', 'warning', 'danger'];
let nextId = 1;

function ProfileBadge({ name, colour, onLog }) {
  // MOUNT / UNMOUNT
  useEffect(() => {
    onLog('mount', 'mounted – the badge is on the screen');
    return () => onLog('unmount', 'unmounted – cleanup of the [] effect');
  }, [onLog]);

  // UPDATE: remember the previous props in a ref and compare after each render.
  const previous = useRef({ name, colour });
  useEffect(() => {
    const changed = [];
    if (previous.current.name !== name) changed.push(`name "${previous.current.name}" → "${name}"`);
    if (previous.current.colour !== colour) changed.push(`colour ${previous.current.colour} → ${colour}`);
    if (changed.length > 0) onLog('update', `updated because ${changed.join(' and ')}`);
    previous.current = { name, colour };
  }); // no array: check after every render (it only logs when something changed)

  // CLEANUP before the next run: e.g. "unsubscribe from the old name's notifications"
  useEffect(() => {
    onLog('effect', `subscribed to notifications for ${name}`);
    return () => onLog('cleanup', `unsubscribed from ${name}`);
  }, [name, onLog]);

  return (
    <div className={`alert alert-${colour === 'primary' ? 'info' : colour} hooks-badge`}>
      <span className="avatar" aria-hidden="true">{name[0]}</span>
      <span>Hi, I’m <strong>{name}</strong>’s profile badge.</span>
    </div>
  );
}

const KIND_BADGE = { mount: 'badge-success', update: 'badge-primary', effect: 'badge-info', cleanup: 'badge-warning', unmount: 'badge-danger' };

export default function LifecycleLog() {
  const [visible, setVisible] = useState(true);
  const [nameIndex, setNameIndex] = useState(0);
  const [colourIndex, setColourIndex] = useState(0);
  const [log, setLog] = useState([]);

  // Stable function (useCallback) so the child's effects don't re-run just because the parent re-rendered.
  const addLog = useCallback((kind, message) => {
    const entry = { id: nextId++, kind, message, time: new Date().toLocaleTimeString('en-AU', { hour12: false }) };
    setLog((current) => [entry, ...current].slice(0, 16));
  }, []);

  return (
    <div className="grid-2">
      <div className="stack">
        <div className="row">
          <button type="button" className={`btn ${visible ? 'btn-danger' : 'btn-success'}`} onClick={() => setVisible((v) => !v)}>
            {visible ? 'Unmount' : 'Mount'} the badge
          </button>
          <button type="button" className="btn" disabled={!visible} onClick={() => setNameIndex((i) => (i + 1) % NAMES.length)}>
            Change name
          </button>
          <button type="button" className="btn" disabled={!visible} onClick={() => setColourIndex((i) => (i + 1) % COLOURS.length)}>
            Change colour
          </button>
        </div>
        {visible ? (
          <ProfileBadge name={NAMES[nameIndex]} colour={COLOURS[colourIndex]} onLog={addLog} />
        ) : (
          <p className="muted small m-0">(Nothing rendered – the badge is unmounted.)</p>
        )}
        <p className="hint">
          Development only: StrictMode mounts, unmounts and re-mounts each new component once to help you spot missing
          cleanups – that’s why you may see an extra unsubscribe/unmount pair right after mounting.
        </p>
      </div>

      <div className="stack-sm">
        <div className="row-between">
          <span className="label">Lifecycle log (newest first)</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLog([])}>
            <Trash2 size={14} /> Clear
          </button>
        </div>
        <ol className="hooks-log">
          {log.map((entry) => (
            <li key={entry.id}>
              <time className="subtle">{entry.time}</time>{' '}
              <span className={`badge ${KIND_BADGE[entry.kind]}`}>{entry.kind}</span> {entry.message}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
