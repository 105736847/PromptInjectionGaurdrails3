/**
 * studentJourneys.js – FICTIONAL student journeys for a Sankey diagram:
 *   entry pathway → major → outcome (three years later).
 *
 * d3-sankey wants { nodes: [...], links: [{ source, target, value }] } where
 * source/target are node indexes. Every link also remembers its `pathway`, so
 * the chart can highlight one entry pathway's students all the way through.
 */
export const PATHWAYS = ['School leaver', 'TAFE', 'International', 'Mature age'];
export const MAJORS = ['Artificial Intelligence', 'Data Science', 'Software Development', 'Cybersecurity', 'Games Development'];
export const OUTCOMES = ['Employed in field', 'Further study', 'Still enrolled', 'Withdrew'];

// Students per pathway, split by major (same order as MAJORS).
const INTAKE = [
  [120, 90, 160, 70, 80], // School leaver
  [20, 25, 60, 45, 30], // TAFE
  [110, 130, 70, 40, 10], // International
  [15, 30, 40, 35, 10], // Mature age
];
// Typical outcome shares per pathway (same order as OUTCOMES)…
const OUTCOME_SHARE = [
  [0.52, 0.16, 0.22, 0.1],
  [0.6, 0.08, 0.2, 0.12],
  [0.45, 0.3, 0.17, 0.08],
  [0.55, 0.1, 0.2, 0.15],
];
// …nudged a little by each major.
const MAJOR_SHIFT = [
  [-0.06, 0.06, 0, 0],
  [0, 0.02, 0, -0.02],
  [0.05, 0, -0.05, 0],
  [0.04, 0, 0, -0.04],
  [-0.08, 0, 0.04, 0.04],
];

// Short labels for narrow screens.
const SHORT = {
  'Artificial Intelligence': 'AI', 'Data Science': 'Data Sci', 'Software Development': 'Software',
  'Cybersecurity': 'Cyber', 'Games Development': 'Games',
  'Employed in field': 'Employed', 'Further study': 'Study', 'Still enrolled': 'Enrolled',
};

export const nodes = [
  ...PATHWAYS.map((name) => ({ name, stage: 0 })),
  ...MAJORS.map((name) => ({ name, stage: 1 })),
  ...OUTCOMES.map((name) => ({ name, stage: 2 })),
].map((node) => ({ ...node, short: SHORT[node.name] ?? node.name }));
const majorNode = (m) => PATHWAYS.length + m;
const outcomeNode = (o) => PATHWAYS.length + MAJORS.length + o;

export const links = [];
// Stage 1: pathway → major
INTAKE.forEach((row, p) => row.forEach((value, m) => links.push({ source: p, target: majorNode(m), value, pathway: p })));
// Stage 2: major → outcome, one link per pathway (pushed in pathway order so a pathway's bands stay together)
MAJORS.forEach((_, m) => {
  const split = INTAKE.map((row, p) => {
    const parts = OUTCOME_SHARE[p].map((share, o) => Math.round(row[m] * (share + MAJOR_SHIFT[m][o])));
    parts[2] += row[m] - parts.reduce((a, b) => a + b, 0); // rounding leftovers → "Still enrolled"
    return parts;
  });
  OUTCOMES.forEach((__, o) => {
    split.forEach((parts, p) => {
      if (parts[o] > 0) links.push({ source: majorNode(m), target: outcomeNode(o), value: parts[o], pathway: p });
    });
  });
});
