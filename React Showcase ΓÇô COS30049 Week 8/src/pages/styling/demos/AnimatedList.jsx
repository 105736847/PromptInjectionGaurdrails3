import { useId, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import './AnimatedList.css';

/**
 * AnimatedList – enter AND exit animations without any library.
 *
 * Entering is easy: a new <li> is mounted with a class that has an animation.
 * Leaving is the tricky part – if we delete the item from state, React removes
 * the element immediately and there is nothing left to animate. So:
 *   1. mark the item as `leaving` → CSS plays the exit animation
 *   2. onAnimationEnd → NOW really remove it from state
 */
const START = ['Clean the dataset', 'Train the model', 'Build the FastAPI endpoint'].map((text, index) => ({
  id: index + 1,
  text,
  leaving: false,
}));

export default function AnimatedList() {
  const [items, setItems] = useState(START);
  const [text, setText] = useState('');
  const nextId = useRef(START.length + 1); // a counter that survives re-renders
  const inputId = useId();

  function addItem(event) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, text: trimmed, leaving: false }]);
    setText('');
  }

  // Step 1: don't delete yet – just flag it so the exit animation starts.
  function startRemoving(id) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
  }

  // Step 2: the exit animation has finished – now remove it for real.
  function handleAnimationEnd(event, item) {
    // animationend bubbles: ignore animations that belong to child elements.
    if (event.target !== event.currentTarget) return;
    if (item.leaving) {
      setItems((prev) => prev.filter((other) => other.id !== item.id));
    }
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={addItem}>
        <label className="visually-hidden" htmlFor={inputId}>New task</label>
        <input
          id={inputId}
          className="input styling-list-input"
          placeholder="Add a task, e.g. Write the README"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          <Plus size={16} /> Add
        </button>
      </form>

      <ul className="styling-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`styling-list-item ${item.leaving ? 'is-leaving' : ''}`}
            onAnimationEnd={(event) => handleAnimationEnd(event, item)}
          >
            <span>{item.text}</span>
            <button
              type="button"
              className="btn-icon"
              onClick={() => startRemoving(item.id)}
              disabled={item.leaving}
              aria-label={`Remove “${item.text}”`}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="muted small m-0">All done! Add another task above.</p>}
    </div>
  );
}
