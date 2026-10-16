/**
 * metrics.js – the classification metrics from scikit-learn, in plain JS.
 *
 * A binary classifier outputs a SCORE. A THRESHOLD turns it into a decision:
 *   score >= threshold → "phishing" (positive), otherwise "legitimate".
 * Every metric below depends on that one threshold.
 */

/** Count the four outcomes at a threshold – sklearn's confusion_matrix(). */
export function confusionAt(rows, threshold) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const { label, score } of rows) {
    const predictedPhishing = score >= threshold;
    if (predictedPhishing) label === 1 ? tp++ : fp++;
    else label === 1 ? fn++ : tn++;
  }
  return { tp, fp, fn, tn };
}

const ratio = (a, b) => (b === 0 ? 0 : a / b); // avoid 0 / 0 = NaN

/** Accuracy, precision, recall, F1 and false-positive rate from a confusion matrix. */
export function metricsFrom({ tp, fp, fn, tn }) {
  const precision = ratio(tp, tp + fp); // of the URLs we flagged, how many were phishing?
  const recall = ratio(tp, tp + fn); // of the phishing URLs, how many did we catch? (= TPR)
  return {
    accuracy: ratio(tp + tn, tp + fp + fn + tn),
    precision,
    recall,
    f1: ratio(2 * precision * recall, precision + recall),
    fpr: ratio(fp, fp + tn), // of the legitimate URLs, how many did we wrongly flag?
  };
}

/**
 * Every operating point at once – sklearn's roc_curve() + precision_recall_curve().
 * Sort by score (highest first) and lower the threshold one URL at a time:
 * each step adds one true positive or one false positive.
 */
export function thresholdCurve(rows) {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const positives = rows.filter((d) => d.label === 1).length;
  const negatives = rows.length - positives;
  let tp = 0;
  let fp = 0;
  const points = [{ threshold: 1, fpr: 0, tpr: 0, precision: 1 }];
  sorted.forEach((d, i) => {
    if (d.label === 1) tp++;
    else fp++;
    const lastOfTie = i === sorted.length - 1 || sorted[i + 1].score !== d.score;
    if (lastOfTie) {
      points.push({ threshold: d.score, fpr: fp / negatives, tpr: tp / positives, precision: tp / (tp + fp) });
    }
  });
  return points;
}

/** Area under the ROC curve (trapezoid rule) – sklearn's roc_auc_score(). */
export function rocAuc(points) {
  let area = 0;
  for (let i = 1; i < points.length; i++) {
    area += (points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr) / 2;
  }
  return area;
}

/** Average precision – sklearn's average_precision_score(). */
export function averagePrecision(points) {
  let ap = 0;
  for (let i = 1; i < points.length; i++) ap += (points[i].tpr - points[i - 1].tpr) * points[i].precision;
  return ap;
}

/** The threshold (in steps of 0.01) with the best F1 score. */
export function bestF1Threshold(rows) {
  let best = { threshold: 0.5, f1: -1 };
  for (let t = 0.01; t < 1; t += 0.01) {
    const { f1 } = metricsFrom(confusionAt(rows, t));
    if (f1 > best.f1) best = { threshold: +t.toFixed(2), f1 };
  }
  return best.threshold;
}

/** The HIGHEST threshold that still catches at least `target` of the phishing URLs. */
export function thresholdForRecall(rows, target) {
  for (let t = 0.99; t > 0; t -= 0.01) {
    if (metricsFrom(confusionAt(rows, t)).recall >= target) return +t.toFixed(2);
  }
  return 0;
}
