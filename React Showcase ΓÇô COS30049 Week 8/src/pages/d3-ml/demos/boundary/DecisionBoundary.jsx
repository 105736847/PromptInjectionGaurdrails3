/**
 * DecisionBoundary – a mini "TensorFlow Playground": train a model IN THE
 * BROWSER and watch its decision boundary move.
 *
 * Pattern: mixed
 * D3 owns the contour <g>; React renders the points, the cursor and the controls.
 * - The model's weights live in a REF (mutated 300× a second – not state).
 * - After each frame we take a SNAPSHOT (epoch, loss, probability grid) and
 *   put THAT in state, so rendering stays a pure function of state.
 * - d3.timer runs the loop; the effect's cleanup stops it (pause / unmount).
 * - d3.contours turns the probability grid into filled bands.
 * - No mouse? Focus the plot: the arrow keys move a cursor, Enter adds a point.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import useChartTheme from '../../../../hooks/useChartTheme.js';
import useElementSize from '../../../../hooks/useElementSize.js';
import { DATASETS, makeDataset, morePoints } from './toyDatasets.js';
import { accuracy, createModel, probabilityGrid, trainEpoch } from './tinyNet.js';
import TrainingPanel from './TrainingPanel.jsx';
import PointsTable from './PointsTable.jsx';

const N = 50; // the probability grid is N × N samples
const EXTENT = 1.25; // data space shown: [-1.25, 1.25] in x and y
const EPOCHS_PER_FRAME = 5;
const clampData = (v) => Math.max(-1.2, Math.min(1.2, Math.round(v * 100) / 100));

/** Train for a few epochs (mutates the model) and describe the result. */
function runEpochs(model, points, lr, epochs) {
  let loss = 0;
  for (let e = 0; e < epochs; e++) loss = trainEpoch(model, points, lr);
  return { loss, accuracy: accuracy(model, points), grid: probabilityGrid(model, N, EXTENT) };
}

export default function DecisionBoundary() {
  const colors = useChartTheme();
  const [ref, { width }] = useElementSize();
  const contourRef = useRef(null);
  const seedRef = useRef(1);
  const modelRef = useRef(null);
  if (modelRef.current === null) modelRef.current = createModel('mlp', 8, d3.randomLcg(0)); // lazy init
  const rngRef = useRef(null);
  if (rngRef.current === null) rngRef.current = d3.randomLcg(2026); // for "+10 points" (seeded)

  const [dataset, setDataset] = useState('moons');
  const [points, setPoints] = useState(() => makeDataset('moons'));
  const [kind, setKind] = useState('mlp');
  const [hidden, setHidden] = useState(8);
  const [lr, setLr] = useState(0.3);
  const [playing, setPlaying] = useState(false);
  const [addLabel, setAddLabel] = useState(1);
  const [cursor, setCursor] = useState({ x: 0, y: 0 }); // the keyboard cursor, in data units
  const [snap, setSnap] = useState(() => ({
    epoch: 0, loss: null, accuracy: accuracy(modelRef.current, points), history: [], grid: probabilityGrid(modelRef.current, N, EXTENT),
  }));

  const size = Math.min(width, 420);
  const canTrain = points.length > 0; // nothing to learn from an empty dataset
  const scale = d3.scaleLinear([-EXTENT, EXTENT], [0, size]); // data → pixels (x)
  const scaleY = d3.scaleLinear([-EXTENT, EXTENT], [size, 0]); // y grows upwards in data space

  // Record a training step in state. The result is computed OUTSIDE the updater
  // (updaters must be pure – StrictMode calls them twice). useCallback + [] =
  // the same function on every render, so it is safe in the effect's deps.
  const record = useCallback((result, epochs) => setSnap((s) => ({
    ...result, epoch: s.epoch + epochs, history: [...s.history.slice(-199), result.loss],
  })), []);

  // The training loop. Re-created when its inputs change; stopped by the cleanup.
  useEffect(() => {
    if (!playing || width === 0 || !canTrain) return undefined; // paused, hidden, or no data
    const timer = d3.timer(() => record(runEpochs(modelRef.current, points, lr, EPOCHS_PER_FRAME), EPOCHS_PER_FRAME));
    return () => timer.stop();
  }, [playing, points, lr, width, canTrain, record]);

  // Draw the probability field whenever a new snapshot arrives (or size / theme change).
  useEffect(() => {
    if (size === 0) return;
    const diverging = d3.piecewise(d3.interpolateLab, colors.diverging);
    const soft = (p) => d3.interpolateLab(colors.surface, diverging(p))(0.5); // a lighter wash, so the points stand out
    const path = d3.geoPath(d3.geoIdentity().scale(size / N)); // grid units → pixels
    const bands = d3.contours().size([N, N]).thresholds(d3.range(0.1, 1, 0.1))(snap.grid);
    const g = d3.select(contourRef.current);
    g.selectAll('rect.base').data([null]).join('rect').attr('class', 'base')
      .attr('width', size).attr('height', size).style('fill', soft(0.05));
    g.selectAll('path.band').data(bands, (d) => d.value).join('path').attr('class', 'band')
      .attr('d', path).style('fill', (d) => soft(d.value + 0.05));
    // The decision boundary itself: where P = 0.5
    const boundary = d3.contours().size([N, N]).thresholds([0.5])(snap.grid);
    g.selectAll('path.d3ml-boundary').data(boundary).join('path').attr('class', 'd3ml-boundary').attr('d', path);
  }, [snap.grid, size, colors]);

  function resetModel(nextKind = kind, nextHidden = hidden, nextPoints = points) {
    modelRef.current = createModel(nextKind, nextHidden, d3.randomLcg(seedRef.current++));
    const acc = nextPoints.length ? accuracy(modelRef.current, nextPoints) : null; // null → shown as "–"
    setSnap({ epoch: 0, loss: null, accuracy: acc, history: [], grid: probabilityGrid(modelRef.current, N, EXTENT) });
  }

  function clearPoints() {
    setPlaying(false);
    setPoints([]);
    setSnap((s) => ({ ...s, loss: null, accuracy: null, history: [] })); // nothing left to measure
  }

  function chooseDataset(name) {
    const next = makeDataset(name);
    setDataset(name);
    setPoints(next);
    resetModel(kind, hidden, next);
  }

  function addPoint(event) {
    const [px, py] = d3.pointer(event.nativeEvent, event.currentTarget);
    setPoints([...points, { x: scale.invert(px), y: scaleY.invert(py), label: addLabel }]);
  }

  // The keyboard alternative to clicking: arrows move the cursor (Shift = bigger steps), Enter / Space drops a point.
  function handleKeyDown(event) {
    const step = event.shiftKey ? 0.25 : 0.05;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[event.key]) setCursor((c) => ({ x: clampData(c.x + moves[event.key][0]), y: clampData(c.y + moves[event.key][1]) }));
    else if (event.key === 'Enter' || event.key === ' ') setPoints([...points, { ...cursor, label: addLabel }]);
    else return;
    event.preventDefault(); // no page scrolling while the plot has focus
  }

  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Dataset">
          {DATASETS.map((name) => (
            <button key={name} type="button" className={`btn btn-sm ${name === dataset ? 'active' : ''}`}
              aria-pressed={name === dataset} onClick={() => chooseDataset(name)}>{name}</button>
          ))}
        </div>
        <label className="row" style={{ gap: 6 }}>
          <span className="small muted">Model</span>
          <select className="input d3ml-select" value={kind} onChange={(e) => { setKind(e.target.value); resetModel(e.target.value); }}>
            <option value="logistic">Logistic regression</option>
            <option value="mlp">Neural net (1 hidden layer)</option>
          </select>
        </label>
        {kind === 'mlp' && (
          <label className="row" style={{ gap: 6 }}>
            <span className="small muted">Hidden units</span>
            <select className="input d3ml-select" value={hidden} onChange={(e) => { setHidden(+e.target.value); resetModel(kind, +e.target.value); }}>
              {[2, 4, 8, 16].map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary btn-sm" disabled={!canTrain} onClick={() => setPlaying(!playing)}>
          {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Train</>}
        </button>
        <button type="button" className="btn btn-sm" disabled={playing || !canTrain}
          onClick={() => record(runEpochs(modelRef.current, points, lr, 10), 10)}>
          <StepForward size={14} /> +10 epochs
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => resetModel()}>
          <RotateCcw size={14} /> Reset
        </button>
        {!canTrain && <span className="small muted">Add some points first.</span>}
      </div>
      <ul className="viz-legend">
        <li><span className="viz-swatch" style={{ background: 'var(--div-neg)', borderRadius: '50%' }} /> class A</li>
        <li><span className="viz-swatch" style={{ background: 'var(--div-pos)', borderRadius: '50%' }} /> class B</li>
        <li><span className="viz-key-line" style={{ background: 'var(--color-text)' }} /> decision boundary (P = 0.5)</li>
        <li className="subtle">shading = the model&apos;s P(class B)</li>
      </ul>

      <div className="d3ml-split">
        <div className="viz d3ml-playground" ref={ref}>
          {size > 0 && (
            <svg width={size} height={size} role="group" tabIndex={0} onClick={addPoint} onKeyDown={handleKeyDown} style={{ cursor: 'crosshair' }}
              aria-label={`${points.length} training points and the model's probability field. Epoch ${snap.epoch}. Arrow keys move a cursor, Enter adds a point of class ${addLabel ? 'B' : 'A'}.`}>
              <g ref={contourRef} />
              {points.map((p, i) => (
                <circle key={i} className="d3ml-toy-point" cx={scale(p.x)} cy={scaleY(p.y)} r={5}
                  style={{ fill: p.label ? 'var(--div-pos)' : 'var(--div-neg)' }} />
              ))}
              <rect className="d3ml-frame" width={size} height={size} />
              {/* Only visible while the plot has KEYBOARD focus (CSS :focus-visible) */}
              <circle className="d3ml-cursor" cx={scale(cursor.x)} cy={scaleY(cursor.y)} r={9} />
            </svg>
          )}
        </div>

        <TrainingPanel lr={lr} onLrChange={setLr} addLabel={addLabel} onAddLabelChange={setAddLabel}
          onAddRandom={() => setPoints([...points, ...morePoints(points, addLabel, 10, rngRef.current)])}
          snap={snap} onClear={clearPoints} />
      </div>

      <PointsTable points={points} />
    </div>
  );
}
