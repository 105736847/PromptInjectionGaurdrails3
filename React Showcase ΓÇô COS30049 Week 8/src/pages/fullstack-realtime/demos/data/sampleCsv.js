/**
 * sampleCsv.js – fictional CSV files built in the browser, so the demos work
 * without hunting for a file on your laptop. Seeded random numbers
 * (d3.randomLcg) → the same file every time.
 */
import * as d3 from 'd3';

// A name listed more often is picked more often: most students are at Hawthorn or online.
const CAMPUSES = ['Hawthorn', 'Hawthorn', 'Hawthorn', 'Online', 'Online', 'Sarawak', 'Wantirna'];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** A small student dataset: 2 text columns, 4 numeric ones, a few blank cells. */
export function makeStudentCsv(rows = 160) {
  const random = d3.randomLcg(42);
  const normal = d3.randomNormal.source(random);
  const studyHours = normal(6, 2.2);
  const attendance = normal(82, 11);
  const noise = normal(0, 7);

  const lines = ['student_id,campus,study_hours,attendance_pct,quiz_avg,final_mark'];
  for (let i = 0; i < rows; i++) {
    const hours = clamp(studyHours(), 0, 14);
    const attend = clamp(attendance(), 30, 100);
    const quiz = clamp(38 + hours * 3.3 + (attend - 80) * 0.3 + noise(), 0, 100);
    const final = clamp(22 + hours * 3.4 + quiz * 0.33 + noise(), 0, 100);
    const campus = CAMPUSES[Math.floor(random() * CAMPUSES.length)];
    const blankAttendance = random() < 0.04; // real data always has gaps
    lines.push(
      [103200 + i * 7, campus, hours.toFixed(1), blankAttendance ? '' : attend.toFixed(0), quiz.toFixed(1), final.toFixed(0)].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

/** Roughly `megabytes` MB of CSV text – for testing the upload size limit. */
export function makeLargeCsv(megabytes) {
  const row = '1032457,COS30049,7,42.5\n';
  const count = Math.ceil((megabytes * 1024 * 1024) / row.length);
  return `student_id,unit,week,minutes_online\n${row.repeat(count)}`;
}
