import { useId, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * React escapes text for you – the #1 defence against XSS.
 *
 * Anything you put in {curly braces} is inserted as TEXT, never as HTML.
 * So even if a user types a <script> tag (or the API returns one), it is
 * shown on screen as harmless characters instead of being executed.
 */
const ATTACK = `<img src="x" onerror="alert('Hacked!')">\n<script>alert('XSS')</script>\n<b>Is this bold?</b>`;

// What the browser's HTML for our output box looks like: < becomes &lt; etc.
function toEscapedHtml(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// HTML written by US (never by users) – the only kind that may be injected raw.
const TRUSTED_HTML = 'Formatted by <strong>our own</strong> code, e.g. a <em>Markdown</em> converter.';

export default function SafeText() {
  const [comment, setComment] = useState(ATTACK);
  const id = useId();

  return (
    <div className="stack">
      <div className="field">
        <label className="label" htmlFor={id}>Write a comment (try some HTML)</label>
        <textarea id={id} className="input mono small" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>

      <div className="grid-2">
        <div className="stack-sm">
          <span className="label">Rendered with {'{comment}'}</span>
          <div className="card" style={{ whiteSpace: 'pre-wrap' }}>
            {comment}
          </div>
          <span className="small row" style={{ color: 'var(--color-success)', gap: 6 }}>
            <ShieldCheck size={16} aria-hidden="true" /> Shown as text – nothing ran.
          </span>
        </div>
        <div className="stack-sm">
          <span className="label">…which is this HTML behind the scenes</span>
          <pre className="demo-output m-0">{toEscapedHtml(comment)}</pre>
        </div>
      </div>

      <div className="stack-sm">
        <span className="label">dangerouslySetInnerHTML with trusted, hard-coded HTML</span>
        {/* The long, scary name is deliberate: never pass user or API input here. */}
        <div className="card card-subtle" dangerouslySetInnerHTML={{ __html: TRUSTED_HTML }} />
      </div>
    </div>
  );
}
