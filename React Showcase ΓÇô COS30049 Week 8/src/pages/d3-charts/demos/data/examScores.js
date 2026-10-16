/**
 * examScores.js – 600 fictional exam scores with TWO humps (a "bimodal" distribution):
 * a group that struggled (around 46) and a group that was well prepared (around 74).
 * A histogram with too few bins hides the two humps – try it with the bin slider.
 */
import * as d3 from 'd3';

const rng = d3.randomLcg(3049);
const struggling = d3.randomNormal.source(rng)(46, 10);
const prepared = d3.randomNormal.source(rng)(74, 8);

export const examScores = d3.range(600).map(() => {
  const score = rng() < 0.4 ? struggling() : prepared();
  return Math.round(Math.max(0, Math.min(100, score)));
});
