/**
 * weeklyActive.js – fictional weekly active students on the LMS in 2026.
 * Busy during the two semesters, quiet in the breaks, with a peak around exams.
 */
import * as d3 from 'd3';

export const SEMESTERS = [
  { label: 'Semester 1', start: new Date(2026, 2, 2), end: new Date(2026, 5, 12) },
  { label: 'Semester 2', start: new Date(2026, 7, 3), end: new Date(2026, 10, 13) },
];

const noise = d3.randomNormal.source(d3.randomLcg(2026))(0, 90); // seeded

// d3.timeMonday.range → every Monday of 2026 (52 Date objects)
export const weeks = d3.timeMonday.range(new Date(2026, 0, 1), new Date(2027, 0, 1)).map((date) => {
  const semester = SEMESTERS.find((s) => date >= s.start && date <= s.end);
  let value = 420;
  if (semester) {
    const progress = (date - semester.start) / (semester.end - semester.start); // 0 → 1 through the semester
    value = 1650 + 700 * progress ** 3; // activity climbs towards the exams
  }
  return { date, value: Math.round(Math.max(150, value + noise())) };
});
