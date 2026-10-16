/**
 * lmsActivity.js – fictional LMS activity for the colour-scale heatmap:
 * average logins per student, for each weekday of the 12 teaching weeks.
 * Assignment deadlines (weeks 6, 11, 12) and Sunday-night cramming show up clearly.
 */
import * as d3 from 'd3';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKS = d3.range(1, 13); // [1, 2, …, 12]

const noise = d3.randomNormal.source(d3.randomLcg(7))(0, 0.25); // seeded → identical on every reload
const dayFactor = [1.15, 1.1, 1.05, 1, 0.8, 0.45, 0.85];
const deadline = { 5: 0.2, 6: 0.6, 11: 0.45, 12: 0.75 };

const raw = WEEKS.flatMap((week) =>
  DAYS.map((day, i) => ({
    week,
    day,
    value: Math.max(0.2, +(2.2 * dayFactor[i] * (1 + (deadline[week] ?? 0)) + noise()).toFixed(1)),
  })),
);

export const MEAN = +d3.mean(raw, (d) => d.value).toFixed(2);

// diff = difference from the semester average → data with a meaningful midpoint (diverging)
export const cells = raw.map((d) => ({ ...d, diff: +(d.value - MEAN).toFixed(1) }));
