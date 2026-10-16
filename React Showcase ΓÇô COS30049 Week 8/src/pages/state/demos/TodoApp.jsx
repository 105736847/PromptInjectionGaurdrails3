/**
 * TodoApp – useReducer for state with many kinds of updates.
 *
 *   const [state, dispatch] = useReducer(todoReducer, initialState);
 *   dispatch({ type: 'added', id: 4, text: 'Study' });
 *
 * The component only DESCRIBES what happened (dispatch an action).
 * The reducer (todoReducer.js) decides how the state changes. This keeps the
 * update logic in one place, easy to read and easy to test.
 */
import { useReducer, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import todoReducer, { initialState } from './todoReducer.js';

let nextId = 4;
const FILTERS = { all: () => true, active: (t) => !t.done, done: (t) => t.done };

// One row. Editing is local UI state, so it lives here – not in the reducer.
function TodoItem({ todo, onDispatch }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  function startEditing() {
    setDraft(todo.text); // start from the current text
    setEditing(true);
  }

  function save() {
    const text = draft.trim();
    // Only dispatch when something really changed (an empty text is ignored).
    if (text && text !== todo.text) onDispatch({ type: 'edited', id: todo.id, text });
    setEditing(false);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') save();
    if (event.key === 'Escape') setEditing(false); // throw the draft away
  }

  return (
    <li className="state-task">
      <input type="checkbox" checked={todo.done} aria-label={`Mark "${todo.text}" as done`}
        onChange={() => onDispatch({ type: 'toggled', id: todo.id })} />
      {editing ? (
        <input className="input state-grow" value={draft} autoFocus aria-label="Edit todo"
          onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown} onBlur={save} />
      ) : (
        <span className={`state-grow ${todo.done ? 'state-done' : ''}`} onDoubleClick={startEditing}>
          {todo.text}
        </span>
      )}
      <button type="button" className="btn-icon" onClick={startEditing}
        aria-label={`Edit "${todo.text}"`} disabled={editing}>
        <Pencil size={15} />
      </button>
      <button type="button" className="btn-icon" onClick={() => onDispatch({ type: 'deleted', id: todo.id })}
        aria-label={`Delete "${todo.text}"`}>
        <Trash2 size={15} />
      </button>
    </li>
  );
}

export default function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const [text, setText] = useState('');
  const [actionLog, setActionLog] = useState([]);

  // Wrap dispatch so we can also show every action on screen.
  function send(action) {
    dispatch(action);
    setActionLog((log) => [JSON.stringify(action), ...log].slice(0, 6));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    send({ type: 'added', id: nextId++, text: text.trim() });
    setText('');
  }

  // Derived values – never stored in state.
  const visible = state.todos.filter(FILTERS[state.filter]);
  const activeCount = state.todos.filter((t) => !t.done).length;
  const doneCount = state.todos.length - activeCount;

  return (
    <div className="grid-2">
      <div className="stack">
        <form className="row" onSubmit={handleSubmit}>
          <input className="input state-grow" placeholder="What needs doing?" aria-label="New todo"
            value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn-primary"><Plus size={16} /> Add</button>
        </form>

        <div className="btn-group" role="group" aria-label="Filter todos">
          {Object.keys(FILTERS).map((name) => (
            <button key={name} type="button" className={`btn btn-sm ${state.filter === name ? 'active' : ''}`}
              aria-pressed={state.filter === name} onClick={() => send({ type: 'filter_changed', filter: name })}>
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>

        <ul className="state-task-list">
          {visible.map((todo) => <TodoItem key={todo.id} todo={todo} onDispatch={send} />)}
        </ul>
        {visible.length === 0 && <p className="small muted m-0">Nothing to show here.</p>}

        <div className="row-between">
          <span className="small muted">{activeCount} left · {doneCount} done · double-click a todo to edit</span>
          <button type="button" className="btn btn-sm btn-ghost" disabled={doneCount === 0}
            onClick={() => send({ type: 'cleared_completed' })}>
            Clear completed
          </button>
        </div>
      </div>

      <div className="stack-sm">
        <span className="label">Dispatched actions (newest first)</span>
        <pre className="demo-output">{actionLog.length ? actionLog.join('\n') : 'Add, tick, edit or delete a todo…'}</pre>
      </div>
    </div>
  );
}
