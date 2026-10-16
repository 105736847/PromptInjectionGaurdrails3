/**
 * StatsDashboard – GET /api/students/stats → KPI tiles + two bar charts.
 *
 * All the maths (COUNT, AVG, GROUP BY, CASE) runs INSIDE SQLite: the browser
 * receives a few dozen numbers instead of 60 (or 60 000) students. Never
 * download a whole table just to count it in JavaScript.
 *
 * `version` (StudentsData.jsx) is an effect dependency, so the dashboard
 * refreshes after every create, update or delete anywhere on this page.
 */
import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { studentsApi } from './studentsApi.js';
import { useStudentsData } from './StudentsData.jsx';
import { useRetryWhenBackOnline } from './useStudents.js';
import { RequestError } from './StudentBits.jsx';
import StatBars from './StatBars.jsx';

const GRADE_NAMES = { HD: 'HD · 80–100', D: 'D · 70–79', C: 'C · 60–69', P: 'P · 50–59', N: 'N · 0–49' };

const STATS_SQL = `-- one row of totals
SELECT count(*), avg(score),
       avg(CASE WHEN score >= 50 THEN 1.0 ELSE 0.0 END) AS pass_rate
FROM student;

-- one row per major
SELECT major, count(*), avg(score) FROM student GROUP BY major;

-- scores → grades inside the query, then count per grade
SELECT CASE WHEN score >= 80 THEN 'HD' WHEN score >= 70 THEN 'D'
            WHEN score >= 60 THEN 'C'  WHEN score >= 50 THEN 'P'
            ELSE 'N' END AS grade,
       count(*), avg(score)
FROM student GROUP BY grade;`;

function useStudentStats() {
  const { version } = useStudentsData();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ stats: null, error: null, loading: true, updatedAt: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    studentsApi
      .stats({ signal: controller.signal })
      .then((stats) => setState({ stats, error: null, loading: false, updatedAt: new Date() }))
      .catch((error) => {
        if (!controller.signal.aborted) setState((s) => ({ ...s, error, loading: false }));
      });
    return () => controller.abort(); // a newer version (or unmount) cancels this request
  }, [version, reloadKey]);

  // useCallback: the same function every render, because it is an effect dependency.
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);
  useRetryWhenBackOnline(state.error, refetch); // the server is back → load again

  return { ...state, refetch };
}

/** The line above the tiles: loading, failed or when the numbers were fetched. */
function statusText({ loading, error, updatedAt }) {
  if (loading) return 'Loading…';
  if (error) return 'Could not load the stats.';
  return updatedAt ? `Last refreshed ${updatedAt.toLocaleTimeString()} – change a student above and watch it update.` : '';
}

export default function StatsDashboard() {
  const { stats, error, loading, updatedAt, refetch } = useStudentStats();
  const atRisk = stats?.by_status.find((b) => b.label === 'at_risk')?.count;

  const tiles = [
    { label: 'Students', value: stats?.total, hint: 'COUNT(*)' },
    { label: 'Average score', value: stats?.average_score, hint: 'AVG(score)' },
    { label: 'Pass rate', value: stats?.pass_rate != null ? `${Math.round(stats.pass_rate * 100)}%` : undefined, hint: 'score ≥ 50' },
    { label: 'At risk', value: atRisk, hint: "status = 'at_risk'" },
  ];

  return (
    <div className="stack">
      <div className="row-between">
        <p className="small muted m-0" aria-live="polite">{statusText({ loading, error, updatedAt })}</p>
        <button type="button" className="btn btn-sm" onClick={refetch} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'crud-spin' : undefined} /> Refresh
        </button>
      </div>

      {/* No "Try again" here: the Refresh button above does the same. */}
      <RequestError error={error} />

      <div className="crud-kpis">
        {tiles.map((tile) => (
          <div key={tile.label} className="card crud-kpi">
            <span className="small muted">{tile.label}</span>
            {/* key={value}: a new value remounts the element → the CSS flash animation replays */}
            <strong key={String(tile.value)} className="crud-kpi-value">{tile.value ?? '–'}</strong>
            <code className="crud-kpi-hint">{tile.hint}</code>
          </div>
        ))}
      </div>

      {stats && (
        <div className={`grid-2 crud-charts ${loading ? 'crud-is-loading' : ''}`}>
          <StatBars title="Grade distribution" total={stats.total}
            data={stats.grades.map((g) => ({ ...g, label: GRADE_NAMES[g.label] }))} />
          <StatBars title="Students per major" total={stats.total} data={stats.by_major} />
        </div>
      )}

      <details className="crud-details">
        <summary>The SQL behind these numbers</summary>
        <pre className="demo-output crud-mono-panel">{STATS_SQL}</pre>
      </details>
    </div>
  );
}
