/**
 * trainingHistory.js – per-epoch metrics for three fictional models, shaped
 * like Keras' `history.history` (or what you'd log from a PyTorch loop):
 *   { loss: [...], val_loss: [...], accuracy: [...], val_accuracy: [...] }
 * We turn them into [{ epoch, value }] arrays because that is what d3.line wants.
 */
import * as d3 from 'd3';

export const EPOCHS = 40;
const rng = d3.randomLcg(8);
const noise = d3.randomNormal.source(rng)(0, 1);

function simulate({ floor, speed, overfitFrom, overfitRate, accCeiling }) {
  const epochs = d3.range(1, EPOCHS + 1);
  // Noise is PROPORTIONAL to the loss (±1.5%): a fixed ±0.004 would be ±27% of a
  // 0.015 loss – a wild zig-zag on a log scale that no real training run shows.
  const loss = epochs.map((e) => (floor + (0.69 - floor) * Math.exp(-e / speed)) * (1 + 0.015 * noise()));
  // After `overfitFrom` epochs the model starts memorising: validation loss climbs again.
  const gap = epochs.map((e) => (e > overfitFrom ? overfitRate * (e - overfitFrom) ** 1.25 : 0));
  const valLoss = loss.map((l, i) => (l + 0.03 + gap[i]) * (1 + 0.03 * noise()));
  // Accuracy mirrors the loss (low loss → high accuracy); overfitting hurts it only a little.
  const acc = (l) => Math.min(0.995, accCeiling - (l - floor) * 0.55 + 0.003 * noise());
  const series = (values) => values.map((value, i) => ({ epoch: i + 1, value }));
  return {
    loss: series(loss),
    val_loss: series(valLoss),
    accuracy: series(loss.map(acc)),
    val_accuracy: series(loss.map((l, i) => acc(l + 0.03 + gap[i] * 0.12) - 0.01)),
  };
}

// Colours: categorical slots 1, 3 and 4. Slot 2 (orange) is skipped on purpose: on this
// page orange means the "phishing" class, and a model is not a class.
export const RUNS = [
  { id: 'logreg', name: 'Logistic regression', short: 'LogReg', color: 'var(--chart-1)',
    history: simulate({ floor: 0.3, speed: 9, overfitFrom: 99, overfitRate: 0, accCeiling: 0.885 }) },
  { id: 'mlp64', name: 'MLP 2 × 64 + dropout', short: 'MLP-64', color: 'var(--chart-3)',
    history: simulate({ floor: 0.12, speed: 7, overfitFrom: 26, overfitRate: 0.002, accCeiling: 0.955 }) },
  { id: 'mlp256', name: 'MLP 3 × 256 (no regularisation)', short: 'MLP-256', color: 'var(--chart-4)',
    history: simulate({ floor: 0.015, speed: 4.5, overfitFrom: 9, overfitRate: 0.012, accCeiling: 0.99 }) },
];

/** Early stopping (Keras EarlyStopping, restore_best_weights=True): the epoch with the lowest val_loss. */
export function bestEpoch(history, patience = 5) {
  const best = d3.least(history.val_loss, (d) => d.value);
  const stoppedAt = Math.min(EPOCHS, best.epoch + patience);
  return { epoch: best.epoch, value: best.value, stoppedAt, triggered: stoppedAt < EPOCHS };
}
