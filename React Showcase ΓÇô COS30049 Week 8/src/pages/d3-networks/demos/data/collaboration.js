/**
 * collaboration.js – a FICTIONAL collaboration network: 18 students in three
 * project studios. weight = number of assignments two students did together.
 * A seeded random generator makes the data identical on every page load.
 */
import * as d3 from 'd3';

export const STUDIOS = ['Studio Aurora', 'Studio Boreal', 'Studio Coral'];

const MEMBERS = [
  ['Ava', 0], ['Hiro', 0], ['Omar', 0], ['Chloe', 0], ['Kai', 0], ['Ruby', 0],
  ['Ben', 1], ['Isla', 1], ['Priya', 1], ['Dev', 1], ['Lena', 1], ['Quinn', 1],
  ['Grace', 2], ['Ella', 2], ['Noah', 2], ['Finn', 2], ['Maya', 2], ['Jack', 2],
];

export const people = MEMBERS.map(([name, studio], id) => ({ id, name, studio }));

const rng = d3.randomLcg(7);
export const collaborations = [];
for (const a of people) {
  for (const b of people) {
    if (b.id <= a.id) continue; // each pair once
    const same = a.studio === b.studio;
    if (rng() < (same ? 0.72 : 0.09)) {
      collaborations.push({ source: a.id, target: b.id, weight: same ? 1 + Math.floor(rng() * 4) : 1 });
    }
  }
}

// Degree = number of different people you worked with.
for (const p of people) {
  p.degree = collaborations.filter((c) => c.source === p.id || c.target === p.id).length;
}

/** Shared projects of two people (0 if they never worked together). */
const weights = new Map(collaborations.map((c) => [`${c.source}-${c.target}`, c.weight]));
export function weightOf(a, b) {
  return weights.get(`${Math.min(a, b)}-${Math.max(a, b)}`) ?? 0;
}

/** The three orderings the matrix can switch between (comparators for Array.sort). */
export const ORDERS = {
  name: { label: 'By name', compare: (a, b) => d3.ascending(a.name, b.name) },
  degree: { label: 'By degree', compare: (a, b) => d3.descending(a.degree, b.degree) || d3.ascending(a.name, b.name) },
  cluster: { label: 'By studio', compare: (a, b) => d3.ascending(a.studio, b.studio) || d3.descending(a.degree, b.degree) },
};
