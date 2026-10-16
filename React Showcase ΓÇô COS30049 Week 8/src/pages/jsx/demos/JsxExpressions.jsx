/**
 * JsxExpressions – the everyday JSX syntax in one place.
 *
 * - {curly braces} switch from "HTML mode" into "JavaScript mode". Anything that
 *   produces a VALUE can go inside: variables, maths, function calls, ternaries,
 *   template strings… (but not statements such as if / for).
 * - Attributes are camelCase: className, htmlFor, onChange, tabIndex, aria-* stays as-is.
 * - style takes a JavaScript OBJECT, not a CSS string.
 * - Every tag must be closed – including <input />, <img /> and <br />.
 */
import { useId, useState } from 'react';

const TOTAL_CREDITS = 300;

// An ordinary JavaScript function – JSX can call it inside { }.
function formatName(first, last) {
  return `${first.trim() || 'Student'} ${last.toUpperCase()}`;
}

// What different values look like when you put them inside { }.
const EXPRESSIONS = [
  { source: '{2 + 3}', value: 2 + 3 },
  { source: "{'COS' + 30049}", value: 'COS' + 30049 },
  { source: '{Math.max(65, 82, 71)}', value: Math.max(65, 82, 71) },
  { source: "{['HD', ' D', ' C']}", value: ['HD', ' D', ' C'], note: 'arrays render each item' },
  { source: '{true} {false} {null} {undefined}', value: [true, false, null, undefined], note: 'renders nothing' },
];

export default function JsxExpressions() {
  const [firstName, setFirstName] = useState('Mia');
  const [credits, setCredits] = useState(150);
  const [highlight, setHighlight] = useState(false);
  const id = useId(); // unique id so <label htmlFor> always matches its <input id>

  // Derived values: just calculate them while rendering.
  const percent = Math.round((credits / TOTAL_CREDITS) * 100);

  // A style OBJECT: camelCase keys (backgroundColor, not background-color).
  const barStyle = {
    width: `${percent}%`,
    backgroundColor: highlight ? 'var(--color-success)' : 'var(--color-primary)',
  };

  return (
    <div className="stack-lg">
      <div className="grid-2">
        <div className="stack">
          {/* htmlFor instead of for – "for" is a reserved word in JavaScript */}
          <div className="field">
            <label className="label" htmlFor={`${id}-name`}>First name</label>
            <input
              id={`${id}-name`}
              className="input"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)} // camelCase event name
            />
          </div>
          <div className="field">
            <label className="label" htmlFor={`${id}-credits`}>Credit points: {credits}</label>
            <input
              id={`${id}-credits`}
              type="range"
              min={0}
              max={TOTAL_CREDITS}
              step={12.5}
              value={credits}
              onChange={(event) => setCredits(Number(event.target.value))}
            />
          </div>
          <label className="check">
            <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} />
            Highlight the card
          </label>
        </div>

        {/* className instead of class – and it can be built with a template string */}
        <article className={`card ${highlight ? 'jsx-card-highlight' : ''}`}>
          <h4 className="card-title">Welcome back, {formatName(firstName, 'Nguyen')}!</h4>
          <p className="muted small">{`${credits} of ${TOTAL_CREDITS} credit points · ${percent}% complete`}</p>
          <div className="jsx-progress" role="progressbar" aria-label="Degree progress"
            aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="jsx-progress-bar" style={barStyle} /> {/* self-closing tag */}
          </div>
          <p className="small mt-1 m-0">
            {credits >= TOTAL_CREDITS ? '🎓 Ready to graduate!' : `${TOTAL_CREDITS - credits} credit points to go.`}
          </p>
        </article>
      </div>

      <div className="table-wrap">
        <table className="table">
          <caption>What happens when you put a value inside {'{ }'}</caption>
          <thead>
            <tr><th scope="col">You write</th><th scope="col">React renders</th></tr>
          </thead>
          <tbody>
            {EXPRESSIONS.map((row) => (
              <tr key={row.source}>
                <td><code>{row.source}</code></td>
                <td>
                  <strong>{row.value}</strong>
                  {row.note && <span className="subtle small"> ← {row.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
