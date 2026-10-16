/**
 * studyLog.js – minutes a (fictional) project team studied on each day of 2024 and 2025.
 * Busy in semester, busiest in assignment and exam weeks, quiet on weekends,
 * mostly empty in the summer holidays. Seeded per year, so it never changes.
 */
import * as d3 from 'd3';

export const STUDY_YEARS = [2024, 2025];
const WEEK = 7 * 24 * 60 * 60 * 1000;
const DAY_FACTOR = [0.9, 1.05, 1.1, 1.0, 0.95, 0.6, 0.45]; // Sunday … Saturday

function yearOfMinutes(year) {
  const rng = d3.randomLcg(year);
  const noise = d3.randomNormal.source(rng)(1, 0.25);
  const semesterStarts = [Date.UTC(year, 2, 4), Date.UTC(year, 7, 5)];
  const days = d3.utcDay.range(new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1)));

  return days.map((date, dayOfYear) => {
    // week of semester: 0–12 teaching (6 = break), 13 = study vacation, 14–16 = exams
    const week = semesterStarts.map((s) => Math.floor((date - s) / WEEK)).find((w) => w >= 0 && w < 17);
    let minutes = week === undefined ? 20 : week === 6 ? 35 : 95;
    if (week === 5 || week === 10) minutes *= 1.8; // assignment weeks
    if (week >= 13) minutes *= 1.6; // study vacation + exams
    minutes *= DAY_FACTOR[date.getUTCDay()];
    const month = date.getUTCMonth();
    const holiday = (month === 11 && date.getUTCDate() >= 20) || (month === 0 && date.getUTCDate() <= 5);
    const restDay = rng() < (week === undefined ? 0.45 : 0.1);
    const value = holiday || restDay ? 0 : Math.round((minutes * noise()) / 5) * 5;
    return { date, dayOfYear, minutes: Math.max(0, value) };
  });
}

// { 2024: [{ date, dayOfYear, minutes }, …], 2025: […] }
export const studyLog = Object.fromEntries(STUDY_YEARS.map((year) => [year, yearOfMinutes(year)]));
