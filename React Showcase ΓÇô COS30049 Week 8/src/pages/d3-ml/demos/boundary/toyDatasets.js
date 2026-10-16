/**
 * toyDatasets.js – the classic 2-D "playground" datasets (like sklearn's
 * make_blobs, make_moons and make_circles), seeded so they never change.
 * Every point: { x, y, label } with x and y roughly in [-1, 1].
 */
import * as d3 from 'd3';

export const DATASETS = ['blobs', 'moons', 'circles', 'xor'];

export function makeDataset(name, n = 160) {
  const rng = d3.randomLcg(DATASETS.indexOf(name) + 7);
  const noise = d3.randomNormal.source(rng);
  const half = n / 2;
  return d3.range(n).map((i) => {
    const label = i < half ? 0 : 1;
    const t = rng();
    if (name === 'blobs') {
      const [cx, cy] = label ? [0.4, 0.35] : [-0.4, -0.3];
      return { x: cx + noise(0, 0.22)(), y: cy + noise(0, 0.22)(), label };
    }
    if (name === 'moons') {
      const angle = Math.PI * t; // two interleaving half circles
      const x = label ? 1 - Math.cos(angle) : Math.cos(angle);
      const y = label ? 0.5 - Math.sin(angle) : Math.sin(angle);
      return { x: (x - 0.5) * 0.7 + noise(0, 0.07)(), y: (y - 0.25) * 0.7 + noise(0, 0.07)(), label };
    }
    if (name === 'circles') {
      const radius = label ? 0.3 : 0.8;
      const angle = 2 * Math.PI * t;
      return { x: radius * Math.cos(angle) + noise(0, 0.07)(), y: radius * Math.sin(angle) + noise(0, 0.07)(), label };
    }
    // xor: class 1 in the top-right and bottom-left quadrants
    const x = (rng() * 0.8 + 0.1) * (rng() < 0.5 ? -1 : 1);
    const sameSign = label === 1;
    const y = (rng() * 0.8 + 0.1) * (sameSign ? Math.sign(x) : -Math.sign(x));
    return { x, y, label };
  });
}

/**
 * `n` more points of class `label` – the keyboard-friendly way to add data.
 * Each one copies a random existing point of that class and nudges it a little,
 * so it looks like the rest of its class (anywhere in the plot if the class is empty).
 */
export function morePoints(points, label, n, rng) {
  const own = points.filter((p) => p.label === label);
  const nudge = d3.randomNormal.source(rng)(0, 0.08);
  const clamp = (v) => Math.max(-1.2, Math.min(1.2, v));
  return d3.range(n).map(() => {
    if (own.length === 0) return { x: rng() * 2 - 1, y: rng() * 2 - 1, label };
    const p = own[Math.floor(rng() * own.length)];
    return { x: clamp(p.x + nudge()), y: clamp(p.y + nudge()), label };
  });
}
