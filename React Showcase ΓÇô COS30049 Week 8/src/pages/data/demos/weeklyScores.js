/**
 * weeklyScores.js – average score per teaching week for the whole cohort and
 * for the "at risk" group.
 *
 * The numbers are made up but DETERMINISTIC: they come from a formula instead
 * of Math.random(), so the chart looks the same on every reload (and in tests).
 * In Assignment 3 data like this would come from your back-end instead.
 */
export const weeklyScores = Array.from({ length: 12 }, (_, index) => {
  const week = index + 1;
  return {
    week,
    // a gentle upward trend + a small wobble so the line looks realistic
    cohort: Math.round(50 + week * 1.2 + Math.sin(week * 1.7) * 2.5),
    atRisk: Math.round(38 + week * 0.8 + Math.cos(week * 1.3) * 3),
  };
});
