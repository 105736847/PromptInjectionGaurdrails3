/**
 * enrolments.js – students enrolled per degree, 2016–2026 (fictional numbers).
 *
 * The race needs more frames than there are years, so we build KEYFRAMES: between two
 * years we add a few in-between frames by linear interpolation (a + (b − a) · t).
 */
import * as d3 from 'd3';

export const YEARS = d3.range(2016, 2027);

export const degrees = [
  { name: 'Computer Science', values: [1480, 1520, 1560, 1600, 1650, 1700, 1720, 1760, 1800, 1840, 1870] },
  { name: 'Software Engineering', values: [1600, 1680, 1760, 1830, 1800, 1760, 1740, 1720, 1700, 1690, 1680] },
  { name: 'Information Systems', values: [1250, 1180, 1100, 1020, 940, 860, 800, 740, 690, 650, 620] },
  { name: 'Cyber Security', values: [320, 410, 540, 700, 880, 1050, 1210, 1340, 1450, 1530, 1600] },
  { name: 'Data Science', values: [180, 300, 470, 660, 860, 1060, 1250, 1400, 1520, 1610, 1680] },
  { name: 'AI & Machine Learning', values: [60, 80, 110, 170, 260, 420, 700, 1080, 1500, 1880, 2150] },
  { name: 'Games Development', values: [520, 560, 600, 640, 820, 900, 780, 720, 700, 710, 720] },
  { name: 'Business Analytics', values: [700, 730, 760, 800, 830, 860, 880, 900, 920, 930, 940] },
].map((degree, i) => ({ ...degree, color: `var(--chart-${i + 1})` })); // colour = identity, fixed

export const FRAMES_PER_YEAR = 6;

// keyframes[i] = { year: 2016.5, values: { 'Computer Science': 1500, … } }
export const keyframes = [];
YEARS.forEach((year, y) => {
  const steps = y === YEARS.length - 1 ? 1 : FRAMES_PER_YEAR; // the last year gets one frame
  for (let step = 0; step < steps; step += 1) {
    const t = step / FRAMES_PER_YEAR;
    const values = Object.fromEntries(
      degrees.map((d) => [d.name, d.values[y] + ((d.values[y + 1] ?? d.values[y]) - d.values[y]) * t]),
    );
    keyframes.push({ year: year + t, values });
  }
});
