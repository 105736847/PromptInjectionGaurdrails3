/**
 * submissions.js – weekly submissions (quizzes + assignments) for seven fictional units.
 *
 * Every unit owns a colour slot (--chart-1 … --chart-7). The colour belongs to the UNIT,
 * not to its position in a list, so hiding one unit never repaints the others.
 */
import * as d3 from 'd3';

export const WEEKS = d3.range(1, 13); // teaching weeks 1 … 12 (week 7 = mid-semester break)

const rng = d3.randomLcg(7);
const noise = d3.randomNormal.source(rng)(0, 1);

const UNITS = [
  { id: 'inn', name: 'Innovation Project', short: 'Innovation', enrolled: 420, deadlines: [4, 8, 12] },
  { id: 'ai', name: 'Intro to AI', short: 'AI', enrolled: 360, deadlines: [5, 10] },
  { id: 'vis', name: 'Data Visualisation', short: 'Data Vis', enrolled: 210, deadlines: [6, 11] },
  { id: 'cld', name: 'Cloud Computing', short: 'Cloud', enrolled: 300, deadlines: [3, 9, 12] },
  { id: 'sec', name: 'Cyber Security', short: 'Security', enrolled: 260, deadlines: [5, 11] },
  { id: 'db', name: 'Databases', short: 'Databases', enrolled: 380, deadlines: [4, 8, 10] },
  { id: 'ux', name: 'UX Design', short: 'UX', enrolled: 170, deadlines: [6, 12] },
];

export const units = UNITS.map((unit, i) => ({
  ...unit,
  color: `var(--chart-${i + 1})`,
  values: WEEKS.map((week) => {
    const quizzes = unit.enrolled * (week === 7 ? 0.04 : 0.16 + 0.03 * noise());
    const due = unit.deadlines.includes(week) ? unit.enrolled * (0.78 + 0.05 * noise()) : 0;
    const early = unit.deadlines.includes(week + 1) ? unit.enrolled * 0.12 : 0; // keen students
    return Math.max(0, Math.round(quizzes + due + early));
  }),
}));
