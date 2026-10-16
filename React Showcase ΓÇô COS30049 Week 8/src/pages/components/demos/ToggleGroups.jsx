/**
 * ToggleGroups – a segmented control (pick ONE) and filter chips (pick MANY).
 *
 * - Segmented control = real radio buttons with a custom look. The browser gives
 *   us arrow-key navigation and "only one checked" for free.
 * - Filter chips = toggle buttons with aria-pressed. The selected tags live in
 *   an array in state; the filtered list is derived during render.
 */
import { useId, useState } from 'react';
import { Check, LayoutGrid, List } from 'lucide-react';
import styles from './ToggleGroups.module.css';

const VIEWS = [
  { id: 'list', label: 'List', icon: List },
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
];
const TAGS = ['Web', 'AI', 'Data', 'Security', 'Project'];
const UNITS = [
  { code: 'COS30049', name: 'Computing Technology Innovation Project', tags: ['Web', 'AI', 'Project'] },
  { code: 'COS30019', name: 'Introduction to Artificial Intelligence', tags: ['AI'] },
  { code: 'COS20015', name: 'Fundamentals of Data Management', tags: ['Data'] },
  { code: 'COS30043', name: 'Interface Design and Development', tags: ['Web'] },
  { code: 'TNE20003', name: 'Internet and Cybersecurity for Engineering', tags: ['Security'] },
  { code: 'COS40005', name: 'Computing Technology Project A', tags: ['Project', 'Data'] },
];

export default function ToggleGroups() {
  const [view, setView] = useState('list');
  const [selectedTags, setSelectedTags] = useState(['Web']);
  const radioName = useId(); // radios in one group share a name – useId keeps it unique on the page

  function toggleTag(tag) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));
  }

  // Derived: no tags selected → show everything; otherwise units with ANY selected tag.
  const visibleUnits = selectedTags.length === 0 ? UNITS : UNITS.filter((unit) => unit.tags.some((tag) => selectedTags.includes(tag)));

  return (
    <div className="stack">
      <div className="row-between">
        <fieldset className={styles.segmented}>
          <legend className="visually-hidden">Layout</legend>
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <label key={id} className={styles.segment}>
              <input type="radio" name={radioName} value={id} checked={view === id} onChange={() => setView(id)} />
              <span>
                <Icon size={15} aria-hidden="true" /> {label}
              </span>
            </label>
          ))}
        </fieldset>
        <span className="small muted" aria-live="polite">
          Showing {visibleUnits.length} of {UNITS.length} units
        </span>
      </div>

      <div className={styles.chips} role="group" aria-label="Filter by topic">
        {TAGS.map((tag) => {
          const pressed = selectedTags.includes(tag);
          return (
            <button key={tag} type="button" className={styles.chip} aria-pressed={pressed} onClick={() => toggleTag(tag)}>
              {pressed && <Check size={14} aria-hidden="true" />}
              {tag}
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedTags([])}>
            Clear filters
          </button>
        )}
      </div>

      <ul className={view === 'grid' ? styles.grid : styles.list}>
        {visibleUnits.map((unit) => (
          <li key={unit.code} className={styles.unit}>
            <span className="badge badge-code">{unit.code}</span>
            <strong>{unit.name}</strong>
            <span className="small muted">{unit.tags.join(' · ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
