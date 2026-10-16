/**
 * UploadProgress – determinate and indeterminate progress indicators.
 *
 * - A setInterval inside useEffect simulates an upload. It only runs while
 *   `isRunning` is true and is cleared in the cleanup ("Pause" = stop the interval).
 * - "Finished" is DERIVED (progress >= 100) instead of being stored in
 *   another state variable that we would have to keep in sync.
 * - The same number drives a linear bar and a circular SVG ring.
 */
import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import styles from './Progress.module.css';

const FILE_MB = 6.4;

function ProgressRing({ value, size = 96, stroke = 9 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100); // how much of the circle is still "empty"
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.ring} aria-hidden="true">
      <circle className={styles.ringTrack} cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
      <circle
        className={styles.ringValue}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} // start at 12 o'clock
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={styles.ringText}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export default function UploadProgress() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  const finished = progress >= 100;
  const isRunning = running && !finished;

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setInterval(() => setProgress((p) => Math.min(p + 3, 100)), 150);
    return () => clearInterval(timer);
  }, [isRunning]);

  function handleStartPause() {
    if (finished) {
      setProgress(0); // start a new upload
      setRunning(true);
    } else {
      setRunning((r) => !r); // toggle between running and paused
    }
  }

  function reset() {
    setRunning(false);
    setProgress(0);
  }

  const status = finished ? 'Upload complete' : isRunning ? 'Uploading…' : progress > 0 ? 'Paused' : 'Ready to upload';

  return (
    <div className="stack-lg">
      <div className={styles.upload}>
        <ProgressRing value={progress} />
        <div className="stack-sm" style={{ flex: 1, minWidth: 200 }}>
          <div className="row-between">
            <strong className="mono small">team12-demo.zip</strong>
            <span className="small muted">
              {((progress / 100) * FILE_MB).toFixed(1)} / {FILE_MB} MB
            </span>
          </div>
          {/* role="progressbar" + aria-value* is what a screen reader announces */}
          <div className={styles.track} role="progressbar" aria-label="Uploading team12-demo.zip" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className={styles.fill} style={{ width: `${progress}%` }} data-done={finished} />
          </div>
          <span className="small muted" aria-live="polite">{status}</span>
          <div className="row">
            <button type="button" className="btn btn-sm btn-primary" onClick={handleStartPause}>
              {isRunning ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
              {finished ? 'Upload again' : isRunning ? 'Pause' : progress > 0 ? 'Resume' : 'Start upload'}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={reset} disabled={progress === 0}>
              <RotateCcw size={14} aria-hidden="true" /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="stack-sm">
        <span className="small">Indeterminate – we don’t know how long it will take:</span>
        {/* No aria-valuenow = indeterminate */}
        <div className={`${styles.track} ${styles.indeterminate}`} role="progressbar" aria-label="Waiting for the server" />
      </div>
    </div>
  );
}
