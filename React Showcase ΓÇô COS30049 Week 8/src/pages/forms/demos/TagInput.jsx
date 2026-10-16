import { useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import styles from './TagInput.module.css';

/**
 * A tag / chip input built from an ordinary <input>.
 *
 * - Enter or comma adds the typed text as a tag (pasting "a, b, c" adds three).
 * - Backspace in an empty input removes the last tag.
 * - Duplicates are ignored (case-insensitive).
 * onKeyDown lets us react to keys BEFORE the browser inserts the character.
 */
const MAX_TAGS = 8;
const SUGGESTIONS = ['React', 'Python', 'FastAPI', 'Machine learning', 'Data viz', 'Figma'];

export default function TagInput() {
  const id = useId();
  const inputRef = useRef(null);
  const [tags, setTags] = useState(['React', 'Teamwork']);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  function addTags(candidates) {
    const next = [...tags];
    const skipped = [];
    for (const raw of candidates) {
      const tag = raw.trim();
      if (!tag) continue;
      if (next.some((t) => t.toLowerCase() === tag.toLowerCase())) skipped.push(`"${tag}" is already added`);
      else if (next.length >= MAX_TAGS) skipped.push(`Maximum ${MAX_TAGS} tags`);
      else next.push(tag);
    }
    setTags(next);
    setMessage(skipped.join(' · '));
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Enter would otherwise submit a surrounding form
      addTags([text]);
      setText('');
    } else if (event.key === 'Backspace' && text === '' && tags.length > 0) {
      setTags(tags.slice(0, -1)); // remove the last tag
    }
  }

  function handleChange(event) {
    const value = event.target.value;
    if (value.includes(',')) {
      // Typed or pasted a comma → everything before the last comma becomes tags
      const parts = value.split(',');
      setText(parts.pop());
      addTags(parts);
    } else {
      setText(value);
      setMessage('');
    }
  }

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  return (
    <div className="stack-sm">
      <label className="label" htmlFor={id}>Project keywords ({tags.length}/{MAX_TAGS})</label>
      {/* Clicking anywhere in the box focuses the real input */}
      <div className={styles.box} onClick={() => inputRef.current.focus()}>
        <ul className={styles.chips} aria-label="Selected keywords">
          {tags.map((tag) => (
            <li key={tag} className={styles.chip}>
              {tag}
              <button type="button" className={styles.remove} aria-label={`Remove ${tag}`}
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}>
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
        <input ref={inputRef} id={id} className={styles.input} value={text} onChange={handleChange}
          onKeyDown={handleKeyDown} placeholder={tags.length ? 'Add more…' : 'Type and press Enter'}
          aria-describedby={`${id}-help`} />
      </div>
      <p id={`${id}-help`} className={message ? 'error-text' : 'hint'} aria-live="polite">
        {message || <>Press <kbd>Enter</kbd> or <kbd>,</kbd> to add · <kbd>Backspace</kbd> removes the last tag</>}
      </p>
      <div className="row small">
        <span className="muted">Suggestions:</span>
        {SUGGESTIONS.filter((s) => !tags.includes(s)).map((s) => (
          <button key={s} type="button" className="btn btn-ghost btn-sm" onClick={() => addTags([s])}>+ {s}</button>
        ))}
      </div>
    </div>
  );
}
