/**
 * RestContract – the whole Students API on one screen, plus a Reset button.
 *
 * REST = resources (nouns) in the URL, actions as HTTP verbs:
 *   the collection  /api/students       GET = list,  POST = create
 *   one item        /api/students/{id}  GET = read,  PATCH = change, DELETE = remove
 * The status code is part of the contract: the front end reacts to it.
 */
import { useState } from 'react';
import { ExternalLink, ListRestart } from 'lucide-react';
import { API_BASE } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { studentsApi } from './studentsApi.js';
import { useStudentsData } from './StudentsData.jsx';
import { RequestError } from './StudentBits.jsx';

const ENDPOINTS = [
  { verb: 'GET', path: '/api/students', body: '– (query: q, major, campus, status, year, sort, order, page, page_size)', ok: '200', errors: '422', returns: 'StudentPage' },
  { verb: 'GET', path: '/api/students/{id}', body: '–', ok: '200', errors: '404 · 422', returns: 'StudentRead' },
  { verb: 'POST', path: '/api/students', body: 'StudentCreate – all fields', ok: '201', errors: '409 · 422', returns: 'StudentRead' },
  { verb: 'PATCH', path: '/api/students/{id}', body: 'StudentUpdate – only changed fields', ok: '200', errors: '404 · 409 · 422', returns: 'StudentRead' },
  { verb: 'DELETE', path: '/api/students/{id}', body: '–', ok: '204', errors: '404 · 422', returns: 'nothing' },
  { verb: 'GET', path: '/api/students/stats', body: '–', ok: '200', errors: '–', returns: 'StudentStats' },
  { verb: 'POST', path: '/api/students/reset', body: '–', ok: '200', errors: '–', returns: '{ restored: 60 }' },
];

export default function RestContract() {
  const { notifyChange } = useStudentsData();
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      const { restored } = await studentsApi.reset();
      notifyChange({ type: 'reset' }); // every table, list and chart on the page refetches
      showToast({ type: 'success', title: 'Demo data restored', message: `${restored} students are back, with their original ids.` });
    } catch (err) {
      setError(err);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="stack">
      <div className="table-wrap crud-table-wrap">
        <table className="table crud-rest-table">
          <caption className="visually-hidden">Endpoints of the Students API</caption>
          <thead>
            <tr><th>Verb</th><th>Path</th><th>Request body</th><th>Success</th><th>Errors</th><th>Response</th></tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e) => (
              <tr key={`${e.verb} ${e.path}`}>
                <td><span className={`crud-verb crud-verb-${e.verb.toLowerCase()}`}>{e.verb}</span></td>
                <td className="mono small">{e.path}</td>
                <td className="small crud-wrap">{e.body}</td>
                <td><span className="badge badge-success">{e.ok}</span></td>
                <td className="small">{e.errors}</td>
                <td className="mono small">{e.returns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row-between">
        <p className="small muted m-0">
          Deleted everything during class? One click puts the 60 demo students back.
        </p>
        <div className="row">
          <a className="btn btn-sm" href={`${API_BASE}/api/docs#/students`} target="_blank" rel="noreferrer">
            Try them in /api/docs <ExternalLink size={13} aria-hidden="true" />
          </a>
          <button type="button" className="btn btn-sm btn-secondary" onClick={handleReset} disabled={resetting}>
            <ListRestart size={14} /> {resetting ? 'Restoring…' : 'Reset demo data'}
          </button>
        </div>
      </div>
      <RequestError error={error} />
    </div>
  );
}
