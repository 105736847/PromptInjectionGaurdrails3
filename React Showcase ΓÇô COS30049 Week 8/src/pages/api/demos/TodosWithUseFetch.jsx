/**
 * TodosWithUseFetch – the same loading / error / data logic, but hidden
 * inside a reusable custom hook: src/hooks/useFetch.js.
 *
 * The component just says WHAT to load. When the URL changes (pick another
 * user), the hook cancels the old request and loads the new one by itself.
 */
import { useState } from 'react';
import { CircleAlert, CircleCheck, Circle, RotateCw } from 'lucide-react';
import useFetch from '../../../hooks/useFetch.js';

const API_URL = 'https://jsonplaceholder.typicode.com';

export default function TodosWithUseFetch() {
  const [userId, setUserId] = useState(1);
  // One line replaces the useState + useEffect + fetch code of the previous demo.
  const { data: todos, loading, error, refetch } = useFetch(`${API_URL}/todos?userId=${userId}&_limit=6`);

  return (
    <div className="stack">
      <div className="row">
        <label className="row small" htmlFor="todo-user">
          Show tasks for
        </label>
        <select
          id="todo-user"
          className="input api-inline-select"
          value={userId}
          onChange={(e) => setUserId(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((id) => (
            <option key={id} value={id}>
              User {id}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-sm btn-ghost" onClick={refetch} disabled={loading}>
          <RotateCw size={14} /> Reload
        </button>
        {loading && <span className="spinner" role="status" aria-label="Loading tasks" />}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <CircleAlert size={20} />
          <span>
            {error.message}{' '}
            <button type="button" className="btn btn-sm" onClick={refetch}>
              Retry
            </button>
          </span>
        </div>
      )}

      {/* useFetch keeps the previous data while the next request runs, so we can
          dim the old list instead of flashing an empty box. */}
      {todos && (
        <ul className={`api-todo-list ${loading ? 'api-stale' : ''}`} aria-busy={loading}>
          {todos.map((todo) => (
            <li key={todo.id}>
              {todo.completed ? (
                <CircleCheck size={18} className="api-done" role="img" aria-label="Done" />
              ) : (
                <Circle size={18} className="subtle" role="img" aria-label="Not done" />
              )}
              <span className={todo.completed ? 'api-done-text' : undefined}>{todo.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
