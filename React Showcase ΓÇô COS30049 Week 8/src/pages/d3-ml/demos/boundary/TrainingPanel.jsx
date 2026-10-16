/**
 * TrainingPanel – the settings and read-outs next to the decision boundary
 * (the Train / +10 epochs / Reset buttons sit in a row ABOVE the plot).
 *
 * A "presentational" component: it owns no state. Everything arrives as props
 * (values + callbacks), so the parent stays the single source of truth.
 */
import { useId } from 'react';
import { Plus } from 'lucide-react';
import LossSparkline from './LossSparkline.jsx';

const CLASS_COLOR = ['var(--div-neg)', 'var(--div-pos)'];

export default function TrainingPanel({ lr, onLrChange, addLabel, onAddLabelChange, onAddRandom, snap, onClear }) {
  const radioName = useId(); // unique name, so two panels on one page never share radios
  return (
    <aside className="stack-sm d3ml-train-panel">
      <label className="field">
        <span className="label">Learning rate <output className="mono">{lr.toFixed(2)}</output></span>
        <input type="range" min={0.01} max={1.5} step={0.01} value={lr} onChange={(e) => onLrChange(Number(e.target.value))} />
      </label>

      <fieldset className="d3ml-add-class">
        <legend className="small muted">Add points of…</legend>
        {[0, 1].map((label) => (
          <label key={label} className="check">
            <input type="radio" name={radioName} checked={addLabel === label} onChange={() => onAddLabelChange(label)} />
            <span className="viz-swatch" style={{ background: CLASS_COLOR[label], borderRadius: '50%' }} />
            class {label ? 'B' : 'A'}
          </label>
        ))}
        <button type="button" className="btn btn-sm" onClick={onAddRandom}><Plus size={14} /> 10 points</button>
        <p className="small subtle m-0">…or click the plot. Keyboard: focus the plot, move with the arrow keys, press Enter.</p>
      </fieldset>

      <dl className="d3ml-readout">
        <div><dt>Epoch</dt><dd>{snap.epoch.toLocaleString()}</dd></div>
        <div><dt>Loss</dt><dd>{snap.loss === null ? '–' : snap.loss.toFixed(3)}</dd></div>
        <div><dt>Accuracy</dt><dd>{snap.accuracy === null ? '–' : `${Math.round(snap.accuracy * 100)}%`}</dd></div>
      </dl>
      <LossSparkline values={snap.history} />
      <button type="button" className="btn btn-sm btn-ghost" onClick={onClear}>Clear all points</button>
    </aside>
  );
}
