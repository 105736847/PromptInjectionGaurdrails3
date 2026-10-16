/**
 * TextMirror – a CONTROLLED input.
 *
 *   <textarea value={text} onChange={(e) => setText(e.target.value)} />
 *
 * React state is the single source of truth: the textarea always shows `text`,
 * and every keystroke goes through setText. Because the value lives in state,
 * everything else (counts, previews, warnings) can be DERIVED from it while
 * rendering – no extra state and no effects needed.
 */
import { useId, useState } from 'react';

const MAX_LENGTH = 140;

export default function TextMirror() {
  const [text, setText] = useState('React makes building interactive UIs painless.');
  const id = useId();

  // Everything below is derived from `text` on each render.
  const characters = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const remaining = MAX_LENGTH - characters;
  const reversed = [...text].reverse().join(''); // [...text] splits safely, even with emoji
  const slug = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const status = remaining < 0 ? 'danger' : remaining <= 20 ? 'warning' : 'ok';

  return (
    <div className="grid-2">
      <div className="stack-sm">
        <label className="label" htmlFor={id}>Your post</label>
        <textarea
          id={id}
          className="input"
          rows={4}
          value={text} // the value comes FROM state…
          onChange={(event) => setText(event.target.value)} // …and every change goes BACK into state
          aria-invalid={status === 'danger'}
          aria-describedby={`${id}-count`}
        />
        <div className="row-between">
          <span id={`${id}-count`} className={`small state-count-${status}`}>
            {remaining >= 0 ? `${remaining} characters left` : `${-remaining} characters over the limit!`}
          </span>
          <span className="row">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setText('')} disabled={!text}>
              Clear
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setText((t) => `${t} 🚀`)}>
              Add 🚀
            </button>
          </span>
        </div>
        <div className="state-scroll-progress" aria-hidden="true">
          <div className={`state-fill-${status}`} style={{ width: `${Math.min(100, (characters / MAX_LENGTH) * 100)}%` }} />
        </div>
      </div>

      <dl className="state-mirror">
        <dt>Characters</dt>
        <dd>{characters} / {MAX_LENGTH}</dd>
        <dt>Words</dt>
        <dd>{words}</dd>
        <dt>UPPERCASE</dt>
        <dd>{text.toUpperCase() || '—'}</dd>
        <dt>Reversed</dt>
        <dd>{reversed || '—'}</dd>
        <dt>URL slug</dt>
        <dd className="mono">{slug || '—'}</dd>
      </dl>
    </div>
  );
}
