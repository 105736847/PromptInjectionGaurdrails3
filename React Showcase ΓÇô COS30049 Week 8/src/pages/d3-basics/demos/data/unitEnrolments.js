/**
 * unitEnrolments.js – shared data for the "two ways" bar charts.
 * Fictional enrolment numbers for eight IT units.
 *
 * d3.randomLcg(seed) is a SEEDED random generator: the page shows the same
 * "random" numbers after every reload, which makes demos repeatable.
 */
import * as d3 from 'd3';

export const UNITS = [
  'COS10009',
  'COS10026',
  'COS20007',
  'COS20019',
  'COS30017',
  'COS30049',
  'SWE30003',
  'TNE10006',
];

export const MAX_STUDENTS = 300; // fixed x-domain, so bar lengths are comparable between clicks

const rng = d3.randomLcg(42);
const randomStudents = d3.randomInt.source(rng)(40, MAX_STUDENTS);

/** A new array of { unit, students } objects – never mutate the old one. */
export function makeEnrolments() {
  return UNITS.map((unit) => ({ unit, students: randomStudents() }));
}
