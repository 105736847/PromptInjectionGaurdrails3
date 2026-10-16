/**
 * ResultsTable – the batch results, sortable by clicking a column header.
 *
 * Sorting is DERIVED data: we keep only { key, direction } in state and sort a
 * copy during render (never sort the prop in place, and no useEffect needed).
 * aria-sort tells screen readers which column is sorted and how.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import { ArrowDown, ArrowUp, ArrowUpDown, CircleCheck, CircleX } from 'lucide-react';
import { probability } from './charts/chartUtils.js';

const COLUMNS = [
  { key: 'row', label: 'Row', numeric: true },
  { key: 'url', label: 'URL' },
  { key: 'probability', label: 'P(suspicious)', numeric: true },
  { key: 'label', label: 'Prediction' },
  { key: 'actual', label: 'Actual', optional: true },
];

export default function ResultsTable({ rows }) {
  const [sort, setSort] = useState({ key: 'probability', direction: 'descending' });
  const hasActual = rows.some((r) => r.actual);
  const columns = COLUMNS.filter((c) => !c.optional || hasActual);

  const compare = sort.direction === 'ascending' ? d3.ascending : d3.descending;
  const sorted = [...rows].sort((a, b) => compare(a[sort.key], b[sort.key]) || a.row - b.row);

  function toggle(key) {
    setSort((s) => ({
      key,
      direction: s.key === key && s.direction === 'descending' ? 'ascending' : 'descending',
    }));
  }

  return (
    <div className="table-wrap mlserve-table-scroll">
      <table className="table mlserve-results-table">
        <caption className="visually-hidden">Predictions for every row of the uploaded CSV</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort.key === c.key;
              const Icon = !active ? ArrowUpDown : sort.direction === 'ascending' ? ArrowUp : ArrowDown;
              return (
                <th key={c.key} scope="col" className={c.numeric ? 'num' : undefined} aria-sort={active ? sort.direction : 'none'}>
                  <button type="button" className="mlserve-sort" onClick={() => toggle(c.key)}>
                    {c.label} <Icon size={13} aria-hidden="true" />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.row}>
              <td className="num">{r.row}</td>
              <td className="mono mlserve-url-cell" title={r.url}>{r.url}</td>
              <td className="num">
                <span className="mlserve-prob">
                  <span className="mlserve-prob-bar" style={{ width: `${r.probability * 100}%` }} />
                </span>
                {probability(r.probability)}
              </td>
              <td>
                <span className={`badge ${r.label === 'suspicious' ? 'badge-danger' : 'badge-success'}`}>{r.label}</span>
              </td>
              {hasActual && (
                <td className="nowrap">
                  {r.actual ?? '–'}{' '}
                  {r.actual && (r.actual === r.label
                    ? <CircleCheck size={14} className="mlserve-ok" aria-label="correct" />
                    : <CircleX size={14} className="mlserve-miss" aria-label="wrong" />)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
