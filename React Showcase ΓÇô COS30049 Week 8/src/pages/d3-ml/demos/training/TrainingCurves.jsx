/**
 * TrainingCurves – loss and accuracy per epoch as TWO aligned charts (never one
 * chart with two y-axes), sharing one x-axis width and one hover state.
 *
 * Pattern: D3 owns the <g>
 * D3 owns the <g> inside each TrainingChart. This parent owns every piece of
 * shared state: which runs are visible, the
 * log-scale switch, the hovered epoch (→ synced crosshair) and the replay
 * progress. Each TrainingChart just draws what it is given.
 * Replay: a chain of d3.timeout calls, one per epoch, like a live dashboard.
 */
import { useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Play } from 'lucide-react';
import useElementSize from '../../../../hooks/useElementSize.js';
import { EPOCHS, RUNS, bestEpoch } from '../data/trainingHistory.js';
import { motion } from '../helpers/chart.js';
import TrainingChart from './TrainingChart.jsx';

const lossFormat = d3.format('.3f');
const accFormat = d3.format('.1%'); // tooltips
const accTicks = d3.format('.0%'); // axis ticks: fewer digits
const lossTicks = d3.format('.1f');

export default function TrainingCurves() {
  const [ref, { width }] = useElementSize(); // ONE width → both charts line up exactly
  const [visible, setVisible] = useState(() => new Set(RUNS.map((r) => r.id)));
  const [logScale, setLogScale] = useState(false);
  const [hoverEpoch, setHoverEpoch] = useState(null);
  const [progress, setProgress] = useState(EPOCHS); // epochs drawn so far
  const [duration, setDuration] = useState(0); // transition length for the next change
  const replaying = progress < EPOCHS; // derived, not stored

  // useMemo keeps these arrays stable between renders, so hovering (which
  // re-renders) does not re-run the charts' D3 effects.
  const runs = useMemo(() => RUNS.filter((r) => visible.has(r.id)), [visible]);
  const markers = useMemo(
    () => runs.map((r) => ({ id: r.id, color: r.color, ...bestEpoch(r.history) })).filter((m) => m.triggered),
    [runs],
  );

  // Each new progress value schedules the next epoch – until we reach the end.
  useEffect(() => {
    if (progress >= EPOCHS) return undefined;
    const timer = d3.timeout(() => setProgress((p) => p + 1), motion(110));
    return () => timer.stop(); // cleanup: also runs on unmount
  }, [progress]);

  // Animate the next change – but not during a replay: a new epoch arrives every
  // 110 ms, and each one would restart (and never finish) a 600 ms transition.
  function animateNext(ms) {
    setDuration(replaying ? 0 : motion(ms));
  }

  function toggleRun(id) {
    if (visible.has(id) && visible.size === 1) return; // keep at least one run
    const next = new Set(visible); // never mutate state – copy it
    if (next.has(id)) next.delete(id);
    else next.add(id);
    animateNext(600);
    setVisible(next);
  }

  function replay() {
    setDuration(0); // no transitions while "streaming" new epochs
    setHoverEpoch(null);
    setProgress(1);
  }

  return (
    <div className="stack">
      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={logScale}
            onChange={(event) => { animateNext(700); setLogScale(event.target.checked); }} />
          <span className="switch-track" /> Log scale for loss
        </label>
        <button type="button" className="btn btn-sm btn-primary" onClick={replay} disabled={replaying}>
          <Play size={14} /> Replay training
        </button>
        <span className="small muted d3ml-live">
          {replaying ? <><span className="d3ml-live-dot" /> Training… epoch {progress} / {EPOCHS}</> : `${EPOCHS} epochs`}
        </span>
      </div>
      {/* The legend doubles as a filter: each button shows or hides one run */}
      <ul className="viz-legend" aria-label="Show or hide runs">
        {RUNS.map((r) => (
          <li key={r.id}>
            <button type="button" aria-pressed={visible.has(r.id)} onClick={() => toggleRun(r.id)}>
              <span className="viz-key-line" style={{ background: r.color }} /> {r.name}
            </button>
          </li>
        ))}
        <li className="subtle">solid = validation · faded = training</li>
      </ul>

      <div ref={ref} className="stack-sm">
        {width > 0 && (
          <>
            <TrainingChart title="Loss (binary cross-entropy)" width={width} runs={runs} metric="loss" logScale={logScale}
              format={lossFormat} tickFormat={lossTicks} progress={progress} duration={duration} hoverEpoch={hoverEpoch}
              onHover={setHoverEpoch} markers={markers} />
            {/* Both charts share the x scale, so only the bottom one needs an x-axis title. */}
            <TrainingChart title="Accuracy" width={width} height={228} runs={runs} metric="accuracy" format={accFormat} tickFormat={accTicks}
              progress={progress} duration={duration} hoverEpoch={hoverEpoch} onHover={setHoverEpoch} xTitle="Epoch" />
          </>
        )}
      </div>

      {/* Tooltips enhance, they never gate: every number is also in this table. */}
      <details className="d3ml-details">
        <summary>Show data table</summary>
        <div className="table-wrap d3ml-table-scroll">
          <table className="table">
            <caption className="small muted">Validation loss / accuracy per epoch</caption>
            <thead>
              <tr>
                <th scope="col">Epoch</th>
                {runs.map((r) => <th key={r.id} scope="col" className="num">{r.short}</th>)}
              </tr>
            </thead>
            <tbody>
              {d3.range(EPOCHS).map((i) => (
                <tr key={i}>
                  <th scope="row">{i + 1}</th>
                  {runs.map((r) => (
                    <td key={r.id} className="num">
                      {lossFormat(r.history.val_loss[i].value)} / {accFormat(r.history.val_accuracy[i].value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
