/**
 * UnitLookup – path parameters vs query parameters, and what FastAPI does with them.
 *
 *   /api/basics/units/AIM30003?semester=2&include_assessments=true
 *                     └─ path ─┘ └──────────── query string ───────────┘
 *
 * Everything in a URL is TEXT. FastAPI converts each part to the Python type the
 * function declares (int, bool, Enum…) and answers 422 when it can't – before
 * your function even runs. The form fields are plain text boxes on purpose, so
 * you can type wrong values and watch the 422 explain what went wrong.
 */
import { useState } from 'react';
import { Search } from 'lucide-react';

import { api } from '../../../api/client.js';
import useRequest from './useRequest.js';
import { OfflineNote, StatusBadge } from './ResponseView.jsx';

const FIELDS = [
  { name: 'unit_code', in: 'path', type: 'str ^[A-Z]{3}\\d{5}$' },
  { name: 'semester', in: 'query', type: 'int, 1–2' },
  { name: 'campus', in: 'query', type: 'Enum', options: ['hawthorn', 'sarawak', 'online'] },
  { name: 'include_assessments', in: 'query', type: 'bool', options: ['true', 'false'] },
  { name: 'limit', in: 'query', type: 'int, 1–5' },
  { name: 'year', in: 'query', type: 'int | None' },
];
const VALID = { unit_code: 'AIM30003', semester: '2', campus: 'online', include_assessments: 'true', limit: '3', year: '' };
const PRESETS = [
  { label: 'Valid', values: VALID },
  { label: 'Lower-case code', values: { ...VALID, unit_code: 'aim30003' } },
  { label: 'semester=3', values: { ...VALID, semester: '3' } },
  { label: 'semester=two', values: { ...VALID, semester: 'two' } },
  { label: 'campus=mars', values: { ...VALID, campus: 'mars' } },
  { label: 'include_assessments=maybe', values: { ...VALID, include_assessments: 'maybe' } },
  { label: 'Unknown unit', values: { ...VALID, unit_code: 'ZZZ99999' } },
];

/** Build the URL from the form: empty query fields are left out (→ the server default). */
function buildUrl(values) {
  const query = FIELDS.filter((f) => f.in === 'query' && values[f.name] !== '').map((f) => [f.name, values[f.name]]);
  const search = new URLSearchParams(query).toString();
  return { code: values.unit_code, query, path: `/api/basics/units/${encodeURIComponent(values.unit_code)}${search ? `?${search}` : ''}` };
}

export default function UnitLookup() {
  const [values, setValues] = useState(VALID);
  const { send, loading, result } = useRequest();
  const url = buildUrl(values); // recomputed on every keystroke → the live URL below

  const lookUp = (path) => send('GET', path, (signal) => api.get(path, { signal }));

  function handleSubmit(event) {
    event.preventDefault();
    lookUp(url.path);
  }

  // A "Try" button fills the form AND sends it, so one click shows FastAPI's answer.
  function tryPreset(presetValues) {
    setValues(presetValues);
    lookUp(buildUrl(presetValues).path); // not url.path: that is still built from the OLD values
  }

  const validation = result?.error?.status === 422 ? result.error.detail : null;
  // One short sentence for screen readers; the details are shown below.
  const summary = result?.data
    ? `${result.data.code}: ${result.data.title}`
    : validation
      ? `${validation.length} validation error${validation.length === 1 ? '' : 's'}, listed in the table below`
      : result?.error && !result.error.isOffline ? result.error.message : '';

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="row small">
        <span className="muted">Try:</span>
        {PRESETS.map((preset) => (
          <button key={preset.label} type="button" className="btn btn-sm btn-ghost" onClick={() => tryPreset(preset.values)}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="fastapi-param-grid">
        {FIELDS.map((field) => (
          <div key={field.name} className="field">
            <label className="label mono" htmlFor={`unit-${field.name}`}>{field.name}</label>
            <input
              id={`unit-${field.name}`}
              className="input mono"
              list={field.options ? `unit-${field.name}-options` : undefined}
              value={values[field.name]}
              onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
              placeholder={field.in === 'query' ? '(leave out)' : ''}
              aria-describedby={`unit-${field.name}-type`}
            />
            {field.options && (
              <datalist id={`unit-${field.name}-options`}>
                {field.options.map((option) => <option key={option} value={option} />)}
              </datalist>
            )}
            <p className="hint fastapi-param-hint" id={`unit-${field.name}-type`}>
              <span className={`badge ${field.in === 'path' ? 'badge-primary' : 'badge-info'}`}>{field.in}</span>
              <span className="mono">{field.type}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="fastapi-url" aria-label="Request URL">
        <span className="fastapi-method">GET</span> /api/basics/units/
        <mark className="fastapi-url-path">{url.code || '???'}</mark>
        {url.query.map(([name, value], i) => (
          <span key={name}>
            {i === 0 ? '?' : '&'}
            {name}=<mark className="fastapi-url-query">{value}</mark>
          </span>
        ))}
      </div>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={loading || !values.unit_code}>
          <Search size={16} aria-hidden="true" /> {loading ? 'Asking…' : 'Send'}
        </button>
        {/* Always rendered (only its content changes), so screen readers announce every answer. */}
        <span className="row" aria-live="polite">
          {result && <StatusBadge status={result.status} />}
          {result && <span className="muted small">{result.ms} ms</span>}
          <span className="visually-hidden">{summary}</span>
        </span>
      </div>

      {result?.error?.isOffline && <OfflineNote error={result.error} />}
      {result && !result.error && <UnitResult unit={result.data} />}
      {result?.error?.status === 404 && <p className="alert alert-warning m-0">{result.error.detail}</p>}
      {validation && (
        <div className="stack-sm">
          <p className="small m-0">
            FastAPI rejected the request <strong>before</strong> <code>get_unit()</code> ran. Each error says{' '}
            <strong>where</strong> (<code>loc</code>), <strong>what</strong> (<code>msg</code>, for humans) and{' '}
            <strong>which rule</strong> (<code>type</code>, for code):
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>loc</th><th>msg</th><th>type</th><th>input</th></tr></thead>
              <tbody>
                {validation.map((error) => (
                  <tr key={error.loc.join('.')}>
                    <td className="mono">{JSON.stringify(error.loc)}</td>
                    <td className="fastapi-wrap fastapi-wrap-wide">{error.msg}</td>
                    <td className="mono">{error.type}</td>
                    <td className="mono">{JSON.stringify(error.input)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </form>
  );
}

function UnitResult({ unit }) {
  return (
    <div className="grid-2">
      <article className="card stack-sm">
        <span className="badge badge-code">{unit.code}</span>
        <h4 className="m-0">{unit.title}</h4>
        <p className="small muted m-0">
          Semester {unit.semester}, {unit.year} · {unit.campus} · {unit.credit_points} credit points
        </p>
        {unit.assessments ? (
          <ul className="small m-0">
            {unit.assessments.map((a) => <li key={a.title}>{a.title} – {a.weight}% (week {a.due_week})</li>)}
          </ul>
        ) : (
          <p className="small subtle m-0">No assessments – include_assessments was false.</p>
        )}
      </article>
      <div className="table-wrap">
        <table className="table">
          <caption className="small">What your function received</caption>
          <tbody>
            {Object.entries(unit.parsed).map(([name, python]) => (
              <tr key={name}><th scope="row" className="mono">{name}</th><td className="mono fastapi-wrap">{python}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
