/**
 * hyperparams.js – 60 runs of a (fictional) hyper-parameter search for a
 * GradientBoostingClassifier – the rows you'd get from pd.DataFrame(
 * RandomizedSearchCV(...).cv_results_) after a little renaming.
 */
import * as d3 from 'd3';

const rng = d3.randomLcg(60);
const noise = d3.randomNormal.source(rng)(0, 1);
const TREES = [50, 100, 200, 300, 400, 500];

export const RUNS = d3.range(60).map((i) => {
  const learning_rate = 10 ** (-2.3 + rng() * 2); // log-uniform between 0.005 and 0.5
  const max_depth = 2 + Math.floor(rng() * 9); // 2 … 10
  const n_estimators = TREES[Math.floor(rng() * TREES.length)];
  // Training time grows with the number of trees and their depth.
  const train_time_s = +(n_estimators * max_depth ** 1.15 * 0.0045 * (1 + 0.15 * noise())).toFixed(1);

  // A made-up but believable response surface for the validation F1 score.
  let f1 = 0.94;
  f1 -= 0.09 * Math.max(0, 1 - (learning_rate * n_estimators) / 12); // too few boosting steps → underfit
  f1 -= 0.06 * Math.max(0, learning_rate - 0.2); // steps too big → unstable
  f1 -= max_depth === 2 ? 0.025 : 0; // stumps are too simple
  f1 -= 0.007 * Math.max(0, max_depth - 6); // very deep trees overfit
  const val_f1 = +Math.min(0.955, Math.max(0.78, f1 + 0.006 * noise())).toFixed(3);

  return { id: i + 1, learning_rate, max_depth, n_estimators, train_time_s: Math.max(0.2, train_time_s), val_f1 };
});

export const DIMENSIONS = [
  { key: 'learning_rate', short: 'lr', type: 'log', format: '.3~f' },
  { key: 'max_depth', short: 'depth', type: 'linear', format: 'd' },
  { key: 'n_estimators', short: 'trees', type: 'linear', format: 'd' },
  { key: 'train_time_s', short: 'time (s)', type: 'linear', format: '.0f' },
  { key: 'val_f1', short: 'val F1', type: 'linear', format: '.2f' },
];
