/**
 * DependencyLab – WHEN does an effect run? It depends on the second argument.
 *
 *   useEffect(fn)            → after EVERY render
 *   useEffect(fn, [])        → once, after the first render (mount)
 *   useEffect(fn, [value])   → after the first render AND whenever `value` changes
 *
 * The <Probe> below has all three. Its effects report to the parent's log.
 * Probe is wrapped in memo() so that updating the LOG doesn't re-render the
 * probe – otherwise "no array" would log → re-render → log → … forever!
 */
import { memo, useCallback, useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';

let nextId = 1;

const Probe = memo(function Probe({ value, other, onLog }) {
  useEffect(() => {
    onLog('none', 'ran after this render');
  }); // no dependency array

  useEffect(() => {
    onLog('empty', 'ran once – the Probe just mounted');
    return () => onLog('empty', 'cleanup – the Probe is unmounting');
  }, [onLog]); // onLog is stable (useCallback), so this is effectively []

  useEffect(() => {
    onLog('value', `ran – value is now ${value}`);
  }, [value, onLog]);

  return (
    <div className="hooks-probe">
      <strong>&lt;Probe /&gt;</strong>
      <span className="small mono">value={value} · other={other}</span>
    </div>
  );
});

const BADGES = { none: 'badge-warning', empty: 'badge-info', value: 'badge-primary' };
const LABELS = { none: 'no array', empty: '[]', value: '[value]' };

export default function DependencyLab() {
  const [value, setValue] = useState(0);
  const [other, setOther] = useState(0);
  const [probeKey, setProbeKey] = useState(0);
  const [log, setLog] = useState([]);

  // useCallback keeps the SAME function between renders, so it is safe in dependency arrays.
  const addLog = useCallback((kind, message) => {
    const entry = { id: nextId++, kind, message };
    setLog((current) => [entry, ...current].slice(0, 14));
  }, []);

  return (
    <div className="grid-2">
      <div className="stack">
        {/* Changing the key makes React throw the old Probe away and mount a new one */}
        <Probe key={probeKey} value={value} other={other} onLog={addLog} />
        <div className="stack-sm">
          <button type="button" className="btn" onClick={() => setValue((v) => v + 1)}>
            Change <code>value</code> (watched)
          </button>
          <button type="button" className="btn" onClick={() => setOther((o) => o + 1)}>
            Change <code>other</code> (not watched)
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setProbeKey((k) => k + 1)}>
            <RefreshCw size={15} /> Remount the Probe
          </button>
        </div>
        <p className="hint">
          In development, React’s StrictMode mounts each component twice on purpose, so on (re)mount you’ll see a
          cleanup between two runs. That doesn’t happen in the production build.
        </p>
      </div>

      <div className="stack-sm">
        <div className="row-between">
          <span className="label">Effect log (newest first)</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLog([])}>
            <Trash2 size={14} /> Clear
          </button>
        </div>
        <ol className="hooks-log">
          {log.map((entry) => (
            <li key={entry.id}>
              <span className={`badge badge-code ${BADGES[entry.kind]}`}>{LABELS[entry.kind]}</span> {entry.message}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
