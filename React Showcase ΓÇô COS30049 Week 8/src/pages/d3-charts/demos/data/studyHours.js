/**
 * studyHours.js – average number of students online on the learning platform,
 * for every hour (0–23) of every day of the week (fictional, seeded).
 * Two base curves (weekday / weekend) plus a few very human exceptions.
 */
import * as d3 from 'd3';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// students online at 0:00, 1:00, … 23:00
const WEEKDAY = [60, 30, 15, 8, 5, 8, 20, 60, 130, 190, 220, 230, 200, 210, 230, 220, 190, 170, 190, 260, 320, 340, 280, 150];
const WEEKEND = [110, 70, 40, 20, 10, 8, 10, 20, 40, 80, 130, 170, 190, 200, 210, 200, 180, 170, 180, 220, 260, 280, 220, 150];
const DAY_FACTOR = [1.05, 1.08, 1.0, 0.97, 0.75, 0.8, 1.1];

const rng = d3.randomLcg(24);
const noise = d3.randomNormal.source(rng)(1, 0.06);

// [{ day: 'Mon', dayIndex: 0, hour: 0, value: 63 }, … 168 rows]
export const studyHours = DAYS.flatMap((day, dayIndex) =>
  d3.range(24).map((hour) => {
    let value = (dayIndex >= 5 ? WEEKEND : WEEKDAY)[hour] * DAY_FACTOR[dayIndex];
    if (day === 'Fri' && hour >= 18) value *= 0.6; // Friday night off
    if (day === 'Sun' && hour >= 19) value *= 1.45; // deadlines are Sunday 11:59 pm…
    return { day, dayIndex, hour, value: Math.round(value * noise()) };
  }),
);
