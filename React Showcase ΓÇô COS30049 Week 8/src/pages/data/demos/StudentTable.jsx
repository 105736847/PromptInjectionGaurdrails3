/**
 * StudentTable – the "table view" of StudentExplorer.
 *
 * It owns no data: rows, sort order and selection all arrive as props, and
 * user actions are reported back up with callback props (onSort, onToggleRow…).
 * Sortable headers use a <button> inside the <th> and `aria-sort` so screen
 * readers announce the current order.
 */
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import GradeBadge from './GradeBadge.jsx';
import IndeterminateCheckbox from './IndeterminateCheckbox.jsx';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'major', label: 'Major' },
  { key: 'campus', label: 'Campus' },
  { key: 'score', label: 'Score', numeric: true },
  { key: 'grade', label: 'Grade' },
  { key: 'status', label: 'Status' },
];

function SortableHeader({ column, sort, onSort }) {
  const isActive = sort.key === column.key;
  const Icon = !isActive ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      className={column.numeric ? 'num' : undefined}
      aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" className="data-sort-button" onClick={() => onSort(column.key)}>
        {column.label}
        <Icon size={14} aria-hidden="true" className={isActive ? '' : 'subtle'} />
      </button>
    </th>
  );
}

export default function StudentTable({
  rows,
  sort,
  onSort,
  selectedIds,
  onToggleRow,
  allSelected,
  someSelected,
  onToggleAll,
  total,
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col" className="data-check-cell">
              <IndeterminateCheckbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onChange={onToggleAll}
                label={`Select all ${total} results`}
              />
            </th>
            {COLUMNS.map((column) => (
              <SortableHeader key={column.key} column={column} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const isSelected = selectedIds.has(s.id);
            return (
              <tr key={s.id} className={isSelected ? 'data-row-selected' : undefined}>
                <td className="data-check-cell">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleRow(s.id)}
                    aria-label={`Select ${s.firstName} ${s.lastName}`}
                  />
                </td>
                <th scope="row">
                  <span className="data-name-cell">
                    {s.firstName} {s.lastName}
                    <span className="small muted">{s.email}</span>
                  </span>
                </th>
                <td className="mono small">{s.studentId}</td>
                <td>{s.major}</td>
                <td>{s.campus}</td>
                <td className="num">{s.score}</td>
                <td>
                  <GradeBadge grade={s.grade} />
                </td>
                <td>
                  <span className={`badge ${s.status === 'At risk' ? 'badge-warning' : ''}`}>{s.status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
