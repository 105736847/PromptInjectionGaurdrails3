/**
 * Breadcrumbs – "where am I?" navigation generated from an ARRAY.
 *
 * - The whole trail is derived from one piece of state: `path`.
 *   Clicking a crumb just cuts the array: path.slice(0, index + 1).
 * - Semantics: <nav aria-label="Breadcrumb"> + an ordered list, and
 *   aria-current="page" on the last item (it is the current page, not a link).
 * - The "/" separators come from CSS (li + li::before) so screen readers skip them.
 */
import { useState } from 'react';
import { File, Folder, House } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

// A tiny fake file system: folder name → its children.
const FOLDERS = {
  Home: ['Units', 'Timetable'],
  Units: ['COS30049', 'COS20007'],
  COS30049: ['Week 8', 'Assignments'],
  COS20007: ['Week 3'],
  'Week 8': ['Lecture slides.pdf', 'Lab sheet.pdf'],
  Assignments: ['Assignment 3 brief.pdf', 'Marking rubric.pdf'],
  'Week 3': ['Lab 3.pdf'],
  Timetable: ['Semester 2.ics'],
};

function Breadcrumbs({ items, onNavigate }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={styles.trail}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item} className={styles.crumb}>
              {isLast ? (
                <span aria-current="page">{item}</span>
              ) : (
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault(); // with React Router you'd use <Link to="…"> instead
                    onNavigate(index);
                  }}
                >
                  {index === 0 && <House size={14} aria-hidden="true" />}
                  {item}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function BreadcrumbsDemo() {
  const [path, setPath] = useState(['Home', 'Units', 'COS30049', 'Week 8']);
  const current = path[path.length - 1];
  const children = FOLDERS[current] ?? [];

  return (
    <div className="stack">
      <Breadcrumbs items={path} onNavigate={(index) => setPath(path.slice(0, index + 1))} />

      <ul className={styles.listing} aria-label={`Contents of ${current}`}>
        {children.map((name) => {
          const isFolder = name in FOLDERS;
          return (
            <li key={name}>
              {isFolder ? (
                <button type="button" className={styles.entry} onClick={() => setPath([...path, name])}>
                  <Folder size={16} aria-hidden="true" /> {name}
                </button>
              ) : (
                <span className={styles.entry}>
                  <File size={16} aria-hidden="true" /> {name}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
