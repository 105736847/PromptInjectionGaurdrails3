/**
 * learners.js – daily active learners on a (fictional) learning platform, 2024–2025.
 *
 * Deterministic: a SEEDED generator (d3.randomLcg) gives the same "random" noise on
 * every reload. The shape comes from a few readable rules: semesters are busy, the
 * mid-semester break is quiet, exams are the peak, weekends and holidays dip.
 */
import * as d3 from 'd3';

const WEEK = 7 * 24 * 60 * 60 * 1000;
export const parseDay = d3.utcParse('%Y-%m-%d');

// Each semester: first teaching day (12 teaching weeks + a break in week 7) and its exams.
const SEMESTERS = [
  { name: 'S1 2024', start: '2024-03-04', exams: ['2024-06-10', '2024-06-29'] },
  { name: 'S2 2024', start: '2024-08-05', exams: ['2024-11-11', '2024-11-30'] },
  { name: 'S1 2025', start: '2025-03-03', exams: ['2025-06-09', '2025-06-28'] },
  { name: 'S2 2025', start: '2025-08-04', exams: ['2025-11-10', '2025-11-29'] },
].map((s) => ({ ...s, start: parseDay(s.start), examStart: parseDay(s.exams[0]), examEnd: parseDay(s.exams[1]) }));

// Shaded, labelled bands on the chart
export const examPeriods = SEMESTERS.map((s) => ({ label: `${s.name} exams`, start: s.examStart, end: s.examEnd }));

// How busy each teaching week is (index 6 = week 7, the mid-semester break)
const WEEK_SHAPE = [0.95, 1.0, 0.98, 0.97, 1.02, 1.12, 0.55, 0.96, 1.0, 1.06, 1.15, 1.18, 1.2];
// Sunday … Saturday (the order of Date.getUTCDay())
const WEEKDAY = [0.88, 1.06, 1.1, 1.05, 0.98, 0.8, 0.62];

function busyness(date) {
  for (const s of SEMESTERS) {
    const week = Math.floor((date - s.start) / WEEK);
    if (week === -1) return 0.55; // orientation week
    if (week >= 0 && week < WEEK_SHAPE.length) return WEEK_SHAPE[week];
    if (week === WEEK_SHAPE.length && date < s.examStart) return 1.25; // study vacation
    if (date >= s.examStart && date < s.examEnd) {
      return 1.42 - 0.3 * ((date - s.examStart) / (s.examEnd - s.examStart)); // busiest at the start
    }
  }
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  if ((month === 11 && day >= 20) || (month === 0 && day <= 4)) return 0.12; // holidays
  return 0.32; // summer / winter term
}

const rng = d3.randomLcg(42);
const noise = d3.randomNormal.source(rng)(0, 0.04);
const days = d3.utcDay.range(parseDay('2024-01-01'), parseDay('2026-01-01'));

export const learners = days.map((date, i) => ({
  date,
  value: Math.round(3400 * busyness(date) * WEEKDAY[date.getUTCDay()] * (1 + (0.1 * i) / 365) * (1 + noise())),
}));

// Monthly averages – used by the table view
export const monthly = d3
  .rollups(learners, (v) => Math.round(d3.mean(v, (d) => d.value)), (d) => d3.utcMonth.floor(d.date))
  .map(([month, average]) => ({ month, average }));
