/**
 * FilterDrawer – a filters panel in a Drawer (a pattern you see on every shop site).
 *
 * The filter values live HERE, in the parent, and the drawer just displays
 * controls for them. So the list updates live while the drawer is open, and
 * the "Filters (2)" count on the button is derived from the same state.
 */
import { useCallback, useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Drawer from './Drawer.jsx';

const UNITS = [
  { code: 'COS10009', name: 'Introduction to Programming', campus: 'Hawthorn', level: 1, places: 40 },
  { code: 'COS20007', name: 'Object Oriented Programming', campus: 'Hawthorn', level: 2, places: 0 },
  { code: 'COS20015', name: 'Fundamentals of Data Management', campus: 'Online', level: 2, places: 12 },
  { code: 'COS30019', name: 'Introduction to Artificial Intelligence', campus: 'Sarawak', level: 3, places: 8 },
  { code: 'COS30043', name: 'Interface Design and Development', campus: 'Online', level: 3, places: 0 },
  { code: 'COS30049', name: 'Computing Technology Innovation Project', campus: 'Hawthorn', level: 3, places: 25 },
];
const CAMPUSES = ['Hawthorn', 'Sarawak', 'Online'];
const DEFAULT_FILTERS = { campuses: [], level: 'any', onlyAvailable: false };

export default function FilterDrawer() {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const close = useCallback(() => setOpen(false), []); // stable function for Drawer's effect
  const radioName = useId();

  const update = (changes) => setFilters((current) => ({ ...current, ...changes }));
  const toggleCampus = (campus) =>
    update({ campuses: filters.campuses.includes(campus) ? filters.campuses.filter((c) => c !== campus) : [...filters.campuses, campus] });

  // Derived data – recalculated on every render.
  const results = UNITS.filter(
    (unit) =>
      (filters.campuses.length === 0 || filters.campuses.includes(unit.campus)) &&
      (filters.level === 'any' || unit.level === Number(filters.level)) &&
      (!filters.onlyAvailable || unit.places > 0),
  );
  const activeCount = filters.campuses.length + (filters.level !== 'any' ? 1 : 0) + (filters.onlyAvailable ? 1 : 0);

  return (
    <div className="stack">
      <div className="row-between">
        <button type="button" className="btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <SlidersHorizontal size={16} aria-hidden="true" /> Filters {activeCount > 0 && <span className="badge badge-primary">{activeCount}</span>}
        </button>
        <span className="small muted" aria-live="polite">{results.length} of {UNITS.length} units</span>
      </div>

      <ul className="stack-sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {results.map((unit) => (
          <li key={unit.code} className="card row-between" style={{ padding: '10px 14px' }}>
            <span><strong className="mono small">{unit.code}</strong> {unit.name}</span>
            <span className={`badge ${unit.places ? 'badge-success' : 'badge-danger'}`}>{unit.places ? `${unit.places} places` : 'Full'}</span>
          </li>
        ))}
        {results.length === 0 && <li className="muted small">No units match these filters.</li>}
      </ul>

      <Drawer
        open={open}
        onClose={close}
        title="Filter units"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset</button>
            <button type="button" className="btn btn-primary" onClick={close}>
              Show {results.length} {results.length === 1 ? 'unit' : 'units'}
            </button>
          </>
        }
      >
        <fieldset>
          <legend>Campus</legend>
          <div className="stack-sm">
            {CAMPUSES.map((campus) => (
              <label key={campus} className="check">
                <input type="checkbox" checked={filters.campuses.includes(campus)} onChange={() => toggleCampus(campus)} />
                {campus}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Year level</legend>
          <div className="row">
            {['any', '1', '2', '3'].map((level) => (
              <label key={level} className="check">
                <input type="radio" name={radioName} value={level} checked={filters.level === level} onChange={() => update({ level })} />
                {level === 'any' ? 'Any' : `Level ${level}`}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="switch">
          <input type="checkbox" checked={filters.onlyAvailable} onChange={(e) => update({ onlyAvailable: e.target.checked })} />
          <span className="switch-track" />
          Only units with free places
        </label>
      </Drawer>
    </div>
  );
}
