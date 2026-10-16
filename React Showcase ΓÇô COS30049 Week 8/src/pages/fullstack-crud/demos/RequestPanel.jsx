/**
 * RequestPanel – what did the table just ask the server for?
 *   1. the exact HTTP request: every control in the UI became a query parameter
 *   2. the SQL that SQLModel runs for it (simplified – see list_students() in students.py)
 * The search text reaches SQLite as a bound PARAMETER (:q), never pasted into the SQL.
 */
import { API_BASE } from '../../../api/client.js';

export function toSql(query) {
  const where = [];
  const bound = [];
  if (query.q) {
    where.push("(first_name || ' ' || last_name LIKE :q\n       OR email LIKE :q OR student_id LIKE :q)");
    bound.push(`:q = '%${query.q}%'`);
  }
  for (const key of ['major', 'campus', 'status', 'year']) {
    if (query[key] === '') continue;
    where.push(`${key} = :${key}`);
    bound.push(key === 'year' ? `:year = ${query.year}` : `:${key} = '${query[key]}'`);
  }
  const whereSql = where.length ? `\nWHERE ${where.join('\n  AND ')}` : '';
  // Ties are broken by name, then id – the same list as list_students() in students.py.
  const tieBreakers = ['last_name', 'first_name', 'id'].filter((column) => column !== query.sort);

  return [
    '-- 1. the rows of this page',
    `SELECT * FROM student${whereSql}`,
    `ORDER BY ${query.sort} ${query.order.toUpperCase()}, ${tieBreakers.join(', ')}   -- tie-breakers`,
    `LIMIT ${query.page_size} OFFSET ${(query.page - 1) * query.page_size};`,
    '',
    '-- 2. how many rows match (for the pager)',
    `SELECT count(*) FROM student${whereSql};`,
    ...(bound.length ? ['', '-- bound parameters (sent separately):', ...bound.map((line) => `--   ${line}`)] : []),
  ].join('\n');
}

/** The last line of the HTTP panel: what came back for THIS url. */
function outcome({ data, error, loading }) {
  if (loading) return '… waiting for FastAPI';
  if (error) return error.isOffline ? '→ no response (the back end is not running)' : `→ ${error.status} – ${error.message}`;
  return data ? `→ 200 OK · ${data.items.length} of ${data.total} rows · ${data.pages} page(s)` : '';
}

export default function RequestPanel({ url, query, data, error, loading }) {
  return (
    <div className="crud-request-panel">
      <div className="stack-sm">
        <h4 className="crud-panel-title">HTTP request</h4>
        <pre className="demo-output crud-mono-panel">
          <span className="crud-verb crud-verb-get">GET</span> {API_BASE}{decodeURIComponent(url)}
          {'\n\n'}
          {outcome({ data, error, loading })}
        </pre>
      </div>
      <div className="stack-sm">
        <h4 className="crud-panel-title">Equivalent SQL (run by SQLModel)</h4>
        <pre className="demo-output crud-mono-panel">{toSql(query)}</pre>
      </div>
    </div>
  );
}
