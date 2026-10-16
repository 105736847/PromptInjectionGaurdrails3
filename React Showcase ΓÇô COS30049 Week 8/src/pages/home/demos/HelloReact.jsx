import { useState } from 'react';

/**
 * Your first React component.
 *
 * - A component is just a JavaScript function that returns JSX.
 * - useState gives the component a piece of memory ("state").
 * - When the state changes, React re-renders and the screen updates by itself.
 */
export default function HelloReact() {
  const [name, setName] = useState('Swinburne');
  const [likes, setLikes] = useState(0);

  return (
    <div className="stack">
      <label className="field" style={{ maxWidth: 320 }}>
        <span className="label">What is your name?</span>
        <input
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Type here…"
        />
      </label>

      {/* Curly braces {} let you put any JavaScript expression inside JSX */}
      <h2 className="m-0">Hello, {name.trim() || 'stranger'}! 👋</h2>

      <div className="row">
        <button className="btn btn-primary" onClick={() => setLikes(likes + 1)}>
          👍 Like
        </button>
        <span className="muted">
          This button has been clicked {likes} {likes === 1 ? 'time' : 'times'}.
        </span>
      </div>
    </div>
  );
}
