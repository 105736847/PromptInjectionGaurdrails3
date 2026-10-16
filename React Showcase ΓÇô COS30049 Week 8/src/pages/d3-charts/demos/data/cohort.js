/**
 * cohort.js – 400 fictional students, made with a SEEDED random generator
 * (d3.randomLcg), so every reload – and every student's laptop – shows the same data.
 *
 * Each student: { id, name, campus, year, major, hours, attendance, score, weekly[12] }
 *   hours      – average study hours per week
 *   attendance – % of classes attended
 *   score      – final score, loosely driven by hours and attendance (+ noise)
 *   weekly     – study hours in each teaching week (deadlines differ per major)
 */
import * as d3 from 'd3';

export const CAMPUSES = ['City', 'Riverside', 'Online']; // exactly 3 → colour slots 1–3
export const MAJORS = ['Software Eng.', 'Data Science', 'Cyber Security', 'AI & ML', 'Games Dev.'];
export const WEEKS = d3.range(1, 13);

const FIRST = ['Aisha', 'Ben', 'Chloe', 'Daniel', 'Emma', 'Farhan', 'Grace', 'Hiroshi', 'Isla', 'Jack',
  'Kavya', 'Liam', 'Mei', 'Noah', 'Olivia', 'Priya', 'Quinn', 'Ravi', 'Sofia', 'Tariq',
  'Uma', 'Victor', 'Wei', 'Xavier', 'Yasmin', 'Zoe', 'Arjun', 'Bella', 'Chen', 'Dylan',
  'Elena', 'Finn', 'Hana', 'Ivan', 'Jasmine', 'Kai', 'Lucas', 'Maya', 'Nikhil', 'Ruby'];
const LAST = ['Nguyen', 'Smith', 'Patel', 'Chen', 'Williams', 'Kim', 'Brown', 'Singh', 'Jones', 'Wang',
  'Taylor', 'Ali', 'Martin', 'Li', 'Wilson', 'Khan', 'Anderson', 'Tran', 'Thomas', 'Lee',
  'White', 'Zhang', 'Harris', 'Gupta', 'Clarke', 'Liu', 'Walker', 'Park', 'Hall', 'Sharma',
  'Young', 'Wu', 'King', 'Rossi', 'Wright', 'Huang', 'Scott', 'Das', 'Green', 'Lopez'];

// Assignment deadlines differ per major, so filtering by major changes the weekly curve.
const DEADLINES = {
  'Software Eng.': [5, 11],
  'Data Science': [6, 10],
  'Cyber Security': [4, 9],
  'AI & ML': [6, 12],
  'Games Dev.': [8, 12],
};

const rng = d3.randomLcg(2049);
const gauss = d3.randomNormal.source(rng)(0, 1);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;

export const cohort = d3.range(400).map((i) => {
  const r = rng();
  const campus = r < 0.45 ? 'City' : r < 0.78 ? 'Riverside' : 'Online';
  const year = 1 + Math.floor(rng() * 3);
  const major = MAJORS[Math.floor(rng() * MAJORS.length)];
  const hours = round1(clamp(10 + year + 5 * gauss(), 1, 30));
  const attendance = Math.round(clamp((campus === 'Online' ? 68 : 82) + 12 * gauss(), 30, 100));
  const score = Math.round(clamp(18 + 2.1 * hours + 0.22 * attendance + 9 * gauss(), 5, 100));
  const deadlines = DEADLINES[major];
  const weekly = WEEKS.map((week) => {
    let f = week === 7 ? 0.45 : 0.75 + 0.03 * week; // week 7 is the mid-semester break
    if (deadlines.includes(week)) f += 0.5;
    if (deadlines.includes(week + 1)) f += 0.2;
    return round1(Math.max(0, hours * f * (1 + 0.12 * gauss())));
  });
  // 40 × 40 name combinations, stepped so that all 400 names are unique
  const name = `${FIRST[i % 40]} ${LAST[(i + 7 * Math.floor(i / 40)) % 40]}`;
  return { id: i + 1, name, campus, year, major, hours, attendance, score, weekly };
});
