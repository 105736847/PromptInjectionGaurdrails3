/**
 * KeysDemo – why `key={index}` is a bug waiting to happen.
 *
 * React uses the key to match each row with the row from the previous render.
 * - key={student.id}: the key travels WITH the student → React moves the row.
 * - key={index}: after inserting at the top, "index 0" is now a different
 *   student, but React thinks it is the same row – so it keeps that row's
 *   DOM (including whatever you typed into its <input>) and only swaps the text.
 *
 * Try it: type a note next to each name, then click "Add to top" or "Shuffle".
 */
import { useId, useState } from 'react';
import { ArrowUpToLine, Shuffle, RotateCcw } from 'lucide-react';

const INITIAL = [
  { id: 1, name: 'Mia' },
  { id: 2, name: 'Liam' },
  { id: 3, name: 'Aisha' },
];
const NEW_NAMES = ['Noah', 'Zara', 'Omar', 'Ruby', 'Kai', 'Isla', 'Leo'];

let nextId = 4; // module-level counter: every new student gets a fresh, unique id

function shuffle(array) {
  const copy = [...array]; // never shuffle state in place – work on a copy
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function NoteList({ title, students, useIndexKey }) {
  const listId = useId();
  return (
    <div className={`card stack-sm ${useIndexKey ? 'jsx-pitfall-wrong' : 'jsx-pitfall-right'}`}>
      <h4 className="m-0">{title}</h4>
      <ul className="jsx-key-list">
        {students.map((student, index) => (
          <li key={useIndexKey ? index : student.id} className="jsx-key-row">
            <span className="badge badge-code">key={useIndexKey ? index : student.id}</span>
            <label className="jsx-key-name" htmlFor={`${listId}-${student.id}`}>{student.name}</label>
            {/* Uncontrolled input: the typed text lives in the DOM, not in React state */}
            <input id={`${listId}-${student.id}`} className="input" placeholder={`Note for ${student.name}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function KeysDemo() {
  const [students, setStudents] = useState(INITIAL);
  const [version, setVersion] = useState(0); // changing this remounts both lists (clears inputs)

  function addToTop() {
    const name = NEW_NAMES[(nextId - 4) % NEW_NAMES.length];
    setStudents([{ id: nextId++, name }, ...students]);
  }

  function reset() {
    setStudents(INITIAL);
    setVersion((v) => v + 1);
  }

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-sm btn-primary" onClick={addToTop}>
          <ArrowUpToLine size={14} /> Add to top
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setStudents(shuffle(students))}>
          <Shuffle size={14} /> Shuffle
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
      {/* A different key on a component = a brand-new component. Handy for "reset". */}
      <div className="grid-2" key={version}>
        <NoteList title="key={index} ❌" students={students} useIndexKey />
        <NoteList title="key={student.id} ✅" students={students} useIndexKey={false} />
      </div>
    </div>
  );
}
