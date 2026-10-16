/**
 * LiveTraining – a (simulated) model trains on the server and streams every epoch over a WebSocket.
 *
 * A WebSocket is TWO-WAY: we send commands ({ action: 'start' } or { action: 'stop' }) and the
 * server pushes about seven messages a second without being asked again.
 * Try a learning rate of 0.001 (too slow) or 0.8 (unstable), or 100 epochs (overfitting!).
 */
import { useId, useState } from 'react';
import { Play, Square, Unplug } from 'lucide-react';
import useWebSocket from './useWebSocket.js';
import ConnectionPill from './ConnectionPill.jsx';
import TrainingCharts from './TrainingCharts.jsx';

const RATES = [
  { value: 0.001, hint: 'far too small – it learns very slowly' },
  { value: 0.01, hint: 'small – still learning after 30 epochs' },
  { value: 0.05, hint: 'a sensible choice' },
  { value: 0.1, hint: 'fast' },
  { value: 0.8, hint: 'far too big – the loss jumps around' },
];
const pct = (v) => (v == null ? '–' : `${(v * 100).toFixed(1)}%`);
const dec = (v) => (v == null ? '–' : v.toFixed(3));
const mean = (list, key) => list.reduce((sum, m) => sum + m[key], 0) / list.length;

/** Read the finished curves the way a data scientist would. Plain JS – no React needed. */
function diagnose(history, best) {
  const recent = history.slice(-10);
  // How far the training loss CLIMBS from one epoch to the next, on average (it should only fall).
  const climb = recent.slice(1).reduce((sum, m, i) => sum + Math.max(0, m.train_loss - recent[i].train_loss), 0) / (recent.length - 1 || 1);
  if (climb > 0.02) {
    return ' – but the training loss keeps jumping up and down: the learning rate is too big, so every step overshoots.';
  }
  if (history.at(-1).train_loss > 0.5) {
    return ' – and the loss was still falling at the end: train for more epochs or use a bigger learning rate.';
  }
  const last5 = history.slice(-5);
  const overfit = best.epoch <= history.length - 5
    && mean(last5, 'val_loss') > best.val_loss + 0.03 // validation got clearly worse …
    && mean(last5, 'train_loss') < best.train_loss; // … while training still improved
  return overfit
    ? ' – after that, training loss kept falling but validation loss rose: the model started to memorise (overfit). Early stopping would keep this epoch.'
    : '.';
}

export default function LiveTraining() {
  const [epochs, setEpochs] = useState(30);
  const [rate, setRate] = useState(0.05);
  // phase: 'idle' | 'starting' | 'training' | 'stopping' | 'done' | 'stopped' – one object, updated per message
  const [run, setRun] = useState({ phase: 'idle', epochs: 30, history: [], best: null, note: null });
  const epochsId = useId();
  const rateId = useId();

  const { status, retryIn, send, drop } = useWebSocket('/api/ws/training', {
    onMessage: (message) => {
      if (message.type === 'started') setRun({ phase: 'training', epochs: message.epochs, history: [], best: null, note: null });
      else if (message.type === 'epoch') setRun((r) => ({ ...r, history: [...r.history, message] }));
      else if (message.type === 'done') setRun((r) => ({ ...r, phase: 'done', best: message.best }));
      else if (message.type === 'stopped') setRun((r) => ({ ...r, phase: 'stopped' }));
      else if (message.type === 'error') {
        // Once we have asked to stop, the only possible error is "Nothing is training right now" (a
        // second stop from a double-click, or a stop that crossed the last epoch). The run is over
        // either way – no red error for that.
        setRun((r) => {
          if (r.phase === 'stopping') return { ...r, phase: 'stopped' };
          if (r.phase === 'stopped' || r.phase === 'done') return r;
          return { ...r, note: message.detail };
        });
      }
    },
    // The server stops training when the socket closes (the `finally` block in realtime.py).
    onClose: () =>
      setRun((r) => (['starting', 'training', 'stopping'].includes(r.phase)
        ? { ...r, phase: 'stopped', note: 'The connection dropped, so the server stopped training. Press Start to run again.' }
        : r)),
  });

  function start() {
    if (send({ action: 'start', epochs, learning_rate: rate })) setRun((r) => ({ ...r, phase: 'starting', note: null }));
  }

  function stop() {
    // 'stopping' disables the button at once, so a double-click can't send a second stop.
    if (send({ action: 'stop' })) setRun((r) => ({ ...r, phase: 'stopping' }));
  }

  const training = ['starting', 'training', 'stopping'].includes(run.phase);
  const latest = run.history.at(-1);
  const best = run.best;
  const shownEpochs = run.phase === 'idle' ? epochs : run.epochs; // before the first run, follow the slider

  return (
    <div className="stack">
      <div className="row-between">
        <ConnectionPill status={status} detail={status === 'reconnecting' ? `retry in ${retryIn} s` : null} />
        {status === 'reconnecting' && retryIn >= 2 && (
          <span className="rt-note">Still can’t reach <code>/api/ws/training</code> – is the back end running?</span>
        )}
      </div>

      <div className="rt-controls">
        <div className="field">
          <label className="label" htmlFor={epochsId}>Epochs: {epochs}</label>
          <input id={epochsId} type="range" min={10} max={100} step={5} value={epochs} disabled={training}
            onChange={(e) => setEpochs(Number(e.target.value))} style={{ height: 40 }} />
        </div>
        <div className="field">
          <label className="label" htmlFor={rateId}>Learning rate</label>
          <select id={rateId} className="input" value={rate} disabled={training} onChange={(e) => setRate(Number(e.target.value))}>
            {RATES.map((r) => <option key={r.value} value={r.value}>{r.value} – {r.hint}</option>)}
          </select>
        </div>
        {training ? (
          <button type="button" className="btn btn-danger" onClick={stop} disabled={run.phase === 'stopping'}>
            <Square size={16} aria-hidden="true" /> {run.phase === 'stopping' ? 'Stopping…' : 'Stop'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={start} disabled={status !== 'open'}>
            <Play size={16} aria-hidden="true" /> Start training
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={drop} disabled={status !== 'open'} title="Close the socket as if the Wi-Fi dropped">
          <Unplug size={16} aria-hidden="true" /> Drop connection
        </button>
      </div>

      <div className="rt-stats">
        <div className="rt-stat"><strong>{latest?.epoch ?? 0}/{shownEpochs}</strong><span>epoch</span></div>
        <div className="rt-stat"><strong>{dec(latest?.train_loss)}</strong><span>training loss</span></div>
        <div className="rt-stat"><strong>{dec(latest?.val_loss)}</strong><span>validation loss</span></div>
        <div className="rt-stat"><strong>{pct(latest?.val_acc)}</strong><span>validation accuracy</span></div>
      </div>

      <TrainingCharts history={run.history} epochs={shownEpochs} />

      {run.note && <p className="error-text" role="alert">{run.note}</p>}
      {run.phase === 'stopped' && !run.note && <p className="rt-note" role="status">Stopped after epoch {latest?.epoch ?? 0}.</p>}
      {run.phase === 'done' && best && (
        <p className="rt-note" role="status">
          Done. The best validation loss was <strong>{dec(best.val_loss)}</strong> at epoch <strong>{best.epoch}</strong>
          {diagnose(run.history, best)}
        </p>
      )}

      {run.history.length > 0 && (
        <details>
          <summary className="small">Show the data ({run.history.length} epochs)</summary>
          <div className="table-wrap mt-1" style={{ maxHeight: 240, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th scope="col">Epoch</th><th scope="col" className="num">Train loss</th><th scope="col" className="num">Val loss</th><th scope="col" className="num">Train acc</th><th scope="col" className="num">Val acc</th></tr>
              </thead>
              <tbody>
                {run.history.map((m) => (
                  <tr key={m.epoch}>
                    <td>{m.epoch}</td><td className="num">{dec(m.train_loss)}</td><td className="num">{dec(m.val_loss)}</td>
                    <td className="num">{pct(m.train_acc)}</td><td className="num">{pct(m.val_acc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
