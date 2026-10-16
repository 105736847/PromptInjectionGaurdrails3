/**
 * embeddingPoints.js – 50,000 fictional points: a 2-D "embedding" of student
 * forum posts, as an ML model might produce, in three topic clusters.
 * Generated once with a seeded random generator, so every reload is identical.
 */
import * as d3 from 'd3';

export const TOPICS = ['Assignments', 'Exams', 'Tech help']; // 3 groups → colour slots 1–3 only

const normal = d3.randomNormal.source(d3.randomLcg(30049))(0, 1);
const CENTRES = [
  { x: -2.2, y: 1.1, spread: 1.1 },
  { x: 2.1, y: 1.7, spread: 0.9 },
  { x: 0.3, y: -1.9, spread: 1.25 },
];

export const ALL_POINTS = Array.from({ length: 50000 }, (_, i) => {
  const topic = i % 3;
  const c = CENTRES[topic];
  return { id: i, topic, x: c.x + c.spread * normal(), y: c.y + c.spread * 0.8 * normal() };
});
