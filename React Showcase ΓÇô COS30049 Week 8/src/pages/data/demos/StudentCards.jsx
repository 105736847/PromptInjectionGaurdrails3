/**
 * StudentCards – the "card view" of StudentExplorer.
 *
 * It receives exactly the same props as StudentTable. Because the data lives
 * in the parent, switching views keeps the search, filters, page and selection.
 */
import GradeBadge from './GradeBadge.jsx';
import IndeterminateCheckbox from './IndeterminateCheckbox.jsx';

export default function StudentCards({ rows, selectedIds, onToggleRow, allSelected, someSelected, onToggleAll, total }) {
  return (
    <div className="stack">
      <label className="check small">
        <IndeterminateCheckbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={onToggleAll}
          label={`Select all ${total} results`}
        />
        Select all {total} results
      </label>

      <ul className="data-cards">
        {rows.map((s) => {
          const isSelected = selectedIds.has(s.id);
          return (
            <li key={s.id} className={`card data-student-card ${isSelected ? 'data-row-selected' : ''}`}>
              <div className="row-between">
                <span className="avatar" aria-hidden="true">
                  {s.firstName[0]}
                  {s.lastName[0]}
                </span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRow(s.id)}
                  aria-label={`Select ${s.firstName} ${s.lastName}`}
                />
              </div>
              <div>
                <h4 className="card-title">
                  {s.firstName} {s.lastName}
                </h4>
                <p className="m-0 small muted">
                  {s.major} · {s.campus}
                </p>
              </div>
              <div className="row-between">
                <span className="small">
                  Score <strong>{s.score}</strong>
                </span>
                <span className="row">
                  {s.status === 'At risk' && <span className="badge badge-warning">At risk</span>}
                  <GradeBadge grade={s.grade} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
