/**
 * BooleanToggles – three everyday widgets that are just ONE boolean in state.
 *
 *   const [on, setOn] = useState(false);
 *   setOn(!on)            // fine for a simple click handler
 *   setOn((v) => !v)      // safest: always flips the LATEST value
 *
 * Each widget is its own component, so each has its own independent state.
 */
import { useId, useState } from 'react';
import { Eye, EyeOff, Heart } from 'lucide-react';

function PasswordField() {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="field">
      <label className="label" htmlFor={id}>Password (demo only)</label>
      <div className="state-input-with-button">
        {/* The boolean decides the input's type attribute */}
        <input id={id} className="input" type={visible ? 'text' : 'password'} defaultValue="react-is-fun"
          autoComplete="off" />
        <button type="button" className="btn-icon" onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <p className="hint">type = &quot;{visible ? 'text' : 'password'}&quot;</p>
    </div>
  );
}

function LikeButton() {
  const [liked, setLiked] = useState(false);
  const likes = 41 + (liked ? 1 : 0); // derived from the boolean – no second state needed

  return (
    <div className="stack-sm">
      <span className="label">Like a post</span>
      <button type="button" className={`btn state-like ${liked ? 'is-liked' : ''}`}
        onClick={() => setLiked((v) => !v)} aria-pressed={liked}>
        <Heart size={18} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
        {liked ? 'Liked' : 'Like'} · {likes}
      </button>
      <p className="hint">liked = {String(liked)}</p>
    </div>
  );
}

const ABOUT_UNIT = `COS30049 brings together everything you have learned so far. In teams you will design,
build and present a working software product: a React front-end, a Python FastAPI back-end and a
machine-learning model that turns real data into useful predictions. Along the way you will practise
agile planning, code reviews, testing and technical communication.`;

function ReadMore({ text, limit = 110 }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > limit;
  const shown = expanded || !isLong ? text : `${text.slice(0, limit).trimEnd()}…`;

  return (
    <div className="stack-sm">
      <span className="label">About the unit</span>
      <p className="small m-0">{shown}</p>
      {isLong && (
        <button type="button" className="btn btn-sm btn-ghost state-align-start"
          onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

export default function BooleanToggles() {
  return (
    <div className="grid-3">
      <div className="card"><PasswordField /></div>
      <div className="card"><LikeButton /></div>
      <div className="card"><ReadMore text={ABOUT_UNIT} /></div>
    </div>
  );
}
