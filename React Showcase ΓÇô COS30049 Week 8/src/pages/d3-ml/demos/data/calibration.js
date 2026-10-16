/**
 * calibration.js – "when the model says 70%, is it right 70% of the time?"
 *
 * We simulate 2,000 test predictions for two models and bin them into ten
 * equal-width bins – exactly what sklearn.calibration.calibration_curve does:
 *   for each bin: mean predicted probability, observed fraction of positives, count.
 */
import * as d3 from 'd3';

const rng = d3.randomLcg(2049);
const beta = d3.randomBeta.source(rng);
const logit = (p) => Math.log(p / (1 - p));
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

function simulate({ mix, low, high, truth }) {
  return d3.range(2000).map(() => {
    const p = Math.min(0.995, Math.max(0.005, rng() < mix ? beta(...low)() : beta(...high)()));
    return { p, label: rng() < truth(p) ? 1 : 0 }; // the TRUE chance of phishing is truth(p)
  });
}

function calibrationCurve(predictions, bins = 10) {
  const binner = d3.bin().value((d) => d.p).domain([0, 1]).thresholds(d3.range(1, bins).map((i) => i / bins));
  return binner(predictions).map((b, i) => ({
    bin: i,
    x0: b.x0,
    x1: b.x1,
    count: b.length,
    predicted: b.length ? d3.mean(b, (d) => d.p) : null,
    observed: b.length ? d3.mean(b, (d) => d.label) : null,
  }));
}

/** Expected calibration error: the count-weighted average gap between predicted and observed. */
function ece(curve) {
  const n = d3.sum(curve, (b) => b.count);
  return d3.sum(curve, (b) => (b.count ? (b.count / n) * Math.abs(b.predicted - b.observed) : 0));
}

const logistic = simulate({ mix: 0.6, low: [1.6, 4], high: [3.5, 2.2], truth: (p) => p }); // calibrated
const boosted = simulate({ mix: 0.6, low: [0.9, 4.5], high: [3.5, 0.9], truth: (p) => sigmoid(0.55 * logit(p)) }); // over-confident

// Categorical slots 1 and 3 – slot 2 (orange) means the "phishing" class on this page.
export const MODELS = [
  { id: 'lr', name: 'Logistic regression', short: 'LogReg', color: 'var(--chart-1)', curve: calibrationCurve(logistic) },
  { id: 'gb', name: 'Gradient boosting (uncalibrated)', short: 'Boosting', color: 'var(--chart-3)', curve: calibrationCurve(boosted) },
].map((m) => ({ ...m, ece: ece(m.curve) }));
