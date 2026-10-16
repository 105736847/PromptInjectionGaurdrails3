/**
 * Stopwatch – a ref holds the interval id.
 *
 * The id returned by setInterval is needed later (to stop the timer) but it
 * is never shown on screen, so it doesn't belong in state: changing it should
 * not cause a re-render. That's exactly what useRef is for.
 *
 * We store the START time too and compute elapsed = now - start on each
 * tick; counting ticks would drift because intervals are not exact.
 */
import { useEffect, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';

function formatTime(ms) {
  const minutes = String(Math.floor(ms / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const hundredths = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}.${hundredths}`;
}

export default function Stopwatch() {
  // Shown on screen → state (changing them must re-render)
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  // Only needed by our code, never shown → refs (changing them must NOT re-render)
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);

  function start() {
    if (intervalRef.current !== null) return; // already running
    startTimeRef.current = Date.now() - elapsed; // continue from where we paused
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 30);
    setRunning(true);
  }

  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setElapsed(Date.now() - startTimeRef.current);
    setRunning(false);
  }

  function reset() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  }

  function lap() {
    const previousTotal = laps[0]?.total ?? 0;
    setLaps([{ number: laps.length + 1, total: elapsed, split: elapsed - previousTotal }, ...laps]);
  }

  // Safety net: if the component unmounts while running, stop the interval.
  useEffect(() => () => clearInterval(intervalRef.current), []);

  // Highlight the fastest and slowest lap (only when there are at least two).
  const splits = laps.map((l) => l.split);
  function lapClass(split) {
    if (laps.length < 2) return '';
    if (split === Math.min(...splits)) return 'is-fastest';
    if (split === Math.max(...splits)) return 'is-slowest';
    return '';
  }

  return (
    <div className="stack hooks-stopwatch">
      <output className="hooks-timer-value hooks-stopwatch-value">{formatTime(elapsed)}</output>
      <div className="row">
        {running ? (
          <button type="button" className="btn btn-danger" onClick={stop}><Pause size={16} /> Stop</button>
        ) : (
          <button type="button" className="btn btn-success" onClick={start}><Play size={16} /> Start</button>
        )}
        <button type="button" className="btn" onClick={lap} disabled={!running}><Flag size={16} /> Lap</button>
        <button type="button" className="btn btn-ghost" onClick={reset} disabled={elapsed === 0}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>
      {laps.length > 0 && (
        <ol className="hooks-laps">
          {laps.map((l) => (
            <li key={l.number} className={lapClass(l.split)}>
              <span>Lap {l.number}</span>
              <span className="mono">+{formatTime(l.split)}</span>
              <span className="mono subtle">{formatTime(l.total)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
