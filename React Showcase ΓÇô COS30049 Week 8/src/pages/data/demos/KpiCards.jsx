/**
 * KpiCards – summary numbers ("key performance indicators") at the top of a
 * dashboard.
 *
 * Every number is DERIVED from the students array with reduce() while
 * rendering. Nothing is copied into state, so the cards can never disagree
 * with the data they summarise.
 */
import { Users, Gauge, CircleCheck, TriangleAlert } from 'lucide-react';
import { students } from '../../../data/students.js';
import { weeklyScores } from './weeklyScores.js';

/** A tiny line chart without axes – just the shape of the trend. */
function Sparkline({ values, label }) {
  const width = 96;
  const height = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Scale every value into the little 96 × 30 box (with 4px padding).
  const points = values.map((value, i) => [
    (i / (values.length - 1)) * (width - 8) + 4,
    height - 4 - ((value - min) / (max - min || 1)) * (height - 8),
  ]);
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg className="data-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <polyline points={points.map((p) => p.join(',')).join(' ')} />
      {/* The current value gets the accent colour, the history stays quiet */}
      <circle cx={lastX} cy={lastY} r="3.5" />
    </svg>
  );
}

export default function KpiCards() {
  // ONE pass over the array collects everything we need.
  const stats = students.reduce(
    (acc, student) => {
      acc.total += 1;
      acc.scoreSum += student.score;
      if (student.score >= 50) acc.passed += 1;
      if (student.status === 'At risk') acc.atRisk += 1;
      return acc;
    },
    { total: 0, scoreSum: 0, passed: 0, atRisk: 0 },
  );
  const average = stats.scoreSum / stats.total;
  const passRate = stats.passed / stats.total;

  // Running total of enrolments per half-year, for the first sparkline.
  const perHalfYear = students.reduce((acc, { enrolled }) => {
    const [year, month] = enrolled.split('-');
    const key = `${year}-${Number(month) <= 6 ? 1 : 2}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  let runningTotal = 0; // a local variable – fine, it is recreated on every render
  const cumulative = Object.keys(perHalfYear)
    .sort()
    .map((key) => {
      runningTotal += perHalfYear[key];
      return runningTotal;
    });

  const percent = new Intl.NumberFormat('en-AU', { style: 'percent' });

  return (
    <div className="data-kpis">
      <article className="card data-kpi">
        <header>
          <span>Total students</span>
          <span className="data-kpi-icon"><Users size={18} aria-hidden="true" /></span>
        </header>
        <p className="data-kpi-value">{stats.total}</p>
        <div className="data-kpi-foot">
          <span className="small muted">Enrolments since 2023</span>
          <Sparkline values={cumulative} label={`Enrolments grew to ${stats.total} over six half-years`} />
        </div>
      </article>

      <article className="card data-kpi">
        <header>
          <span>Average score</span>
          <span className="data-kpi-icon"><Gauge size={18} aria-hidden="true" /></span>
        </header>
        <p className="data-kpi-value">{average.toFixed(1)}</p>
        <div className="data-kpi-foot">
          <span className="small muted">Weekly trend</span>
          <Sparkline
            values={weeklyScores.map((w) => w.cohort)}
            label={`Weekly average rose from ${weeklyScores[0].cohort} to ${weeklyScores.at(-1).cohort}`}
          />
        </div>
      </article>

      <article className="card data-kpi">
        <header>
          <span>Pass rate</span>
          <span className="data-kpi-icon"><CircleCheck size={18} aria-hidden="true" /></span>
        </header>
        <p className="data-kpi-value">{percent.format(passRate)}</p>
        <div className="data-kpi-foot data-kpi-foot-column">
          <span className="small muted">{stats.passed} of {stats.total} scored 50 or more</span>
          <div className="data-kpi-bar" aria-hidden="true">
            <span style={{ width: `${passRate * 100}%` }} />
          </div>
        </div>
      </article>

      <article className="card data-kpi">
        <header>
          <span>At risk</span>
          <span className="data-kpi-icon data-kpi-icon-warning">
            <TriangleAlert size={18} aria-hidden="true" />
          </span>
        </header>
        <p className="data-kpi-value">{stats.atRisk}</p>
        <div className="data-kpi-foot">
          <span className="small muted">
            {percent.format(stats.atRisk / stats.total)} of the cohort need a check-in
          </span>
        </div>
      </article>
    </div>
  );
}
