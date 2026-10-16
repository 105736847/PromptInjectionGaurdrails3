/**
 * ArrayState – adding, removing, updating and re-ordering an ARRAY in state.
 *
 * The golden rule: never change the existing array (no push, splice, sort,
 * or item.done = true). Build a NEW array instead:
 *
 *   add      [...tasks, newTask]
 *   remove   tasks.filter(t => t.id !== id)
 *   update   tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
 *   move     copy = [...tasks]; swap two items in the copy
 *
 * The red button breaks the rule on purpose so you can see what happens.
 */
import { useId, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

let nextId = 4;

const INITIAL_TASKS = [
  { id: 1, title: 'Read the Assignment 3 brief', done: true },
  { id: 2, title: 'Sketch the UI wireframes', done: false },
  { id: 3, title: 'Connect React to the FastAPI endpoint', done: false },
];

export default function ArrayState() {
  // Start from a COPY: the red button mutates the array, and we don't want it to damage INITIAL_TASKS.
  const [tasks, setTasks] = useState(() => [...INITIAL_TASKS]);
  const [title, setTitle] = useState('');
  const inputId = useId();

  function handleAdd(event) {
    event.preventDefault(); // stop the form from reloading the page
    if (!title.trim()) return;
    setTasks([...tasks, { id: nextId++, title: title.trim(), done: false }]);
    setTitle('');
  }

  function handleRemove(id) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  function handleToggle(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function handleMove(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= tasks.length) return;
    const copy = [...tasks];
    [copy[index], copy[target]] = [copy[target], copy[index]]; // swap in the COPY
    setTasks(copy);
  }

  // ❌ The wrong way: mutate, then pass the SAME array back.
  function handleMutate() {
    tasks.push({ id: nextId++, title: 'Sneaky task added with push()', done: false });
    setTasks(tasks); // same reference → React sees "nothing changed" and skips the re-render
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={handleAdd}>
        <label className="visually-hidden" htmlFor={inputId}>New task</label>
        <input id={inputId} className="input state-grow" placeholder="Add a study task…"
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" className="btn btn-primary"><Plus size={16} /> Add</button>
      </form>

      <ol className="state-task-list">
        {tasks.map((task, index) => (
          <li key={task.id} className="state-task">
            <label className="check state-grow">
              <input type="checkbox" checked={task.done} onChange={() => handleToggle(task.id)} />
              <span className={task.done ? 'state-done' : ''}>{task.title}</span>
            </label>
            <button type="button" className="btn-icon" onClick={() => handleMove(index, -1)}
              disabled={index === 0} aria-label={`Move "${task.title}" up`}>
              <ArrowUp size={16} />
            </button>
            <button type="button" className="btn-icon" onClick={() => handleMove(index, 1)}
              disabled={index === tasks.length - 1} aria-label={`Move "${task.title}" down`}>
              <ArrowDown size={16} />
            </button>
            <button type="button" className="btn-icon" onClick={() => handleRemove(task.id)}
              aria-label={`Delete "${task.title}"`}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ol>
      {tasks.length === 0 && <p className="muted small m-0">No tasks – enjoy your weekend! 🎉</p>}

      <div className="row-between">
        <span className="small muted">
          {tasks.filter((t) => t.done).length} of {tasks.length} done
        </span>
        <button type="button" className="btn btn-sm btn-danger" onClick={handleMutate}>
          push() directly (broken)
        </button>
      </div>
      <p className="hint">
        After clicking the red button nothing appears… until any other change causes a re-render – then the
        “sneaky” task suddenly shows up. That delayed, unpredictable update is why mutating state is a bug.
      </p>
    </div>
  );
}
