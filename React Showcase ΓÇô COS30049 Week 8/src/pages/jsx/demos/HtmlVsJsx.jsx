/**
 * HtmlVsJsx – JSX looks like HTML, but it is JavaScript underneath.
 * These are the differences that trip up most students.
 *
 * Switch on "Quiz mode" to hide the JSX column and test yourself:
 * the table is rendered from an array with map(), and the set of revealed
 * rows is kept in state.
 */
import { useState } from 'react';
import { Eye } from 'lucide-react';

const DIFFERENCES = [
  { html: '<div class="card">', jsx: '<div className="card">', why: '"class" is a reserved word in JavaScript.' },
  { html: '<label for="email">', jsx: '<label htmlFor="email">', why: '"for" is also reserved (for loops).' },
  { html: '<button onclick="save()">', jsx: '<button onClick={save}>', why: 'Events are camelCase and receive a function, not a string.' },
  { html: '<p style="font-size: 14px">', jsx: '<p style={{ fontSize: 14 }}>', why: 'style is an object; property names are camelCase.' },
  { html: '<img src="a.png"> <br>', jsx: '<img src="a.png" /> <br />', why: 'Every tag must be closed.' },
  { html: '<!-- comment -->', jsx: '{/* comment */}', why: 'Comments are JavaScript comments inside { }.' },
  { html: '<input tabindex="0" maxlength="5">', jsx: '<input tabIndex={0} maxLength={5} />', why: 'Multi-word attributes are camelCase; numbers go in { }.' },
  { html: '<input value="Hi">', jsx: '<input defaultValue="Hi" />', why: 'value={…} makes a controlled input (see State page).' },
  { html: '<option selected>', jsx: '<select value={choice}>', why: 'The selected option is set on the <select>.' },
  { html: 'aria-label="Close"  data-id="7"', jsx: 'aria-label="Close"  data-id="7"', why: 'aria-* and data-* keep their dashes. ✔' },
  { html: 'Two <p> tags side by side', jsx: '<>…</> around them', why: 'A component returns ONE element (use a Fragment).' },
];

export default function HtmlVsJsx() {
  const [quizMode, setQuizMode] = useState(false);
  const [revealed, setRevealed] = useState([]); // indexes of rows the student has revealed

  function reveal(index) {
    // Never push into state – create a new array instead.
    setRevealed((current) => [...current, index]);
  }

  function toggleQuiz() {
    setQuizMode((on) => !on);
    setRevealed([]);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <label className="switch">
          <input type="checkbox" checked={quizMode} onChange={toggleQuiz} />
          <span className="switch-track" />
          Quiz mode – hide the JSX column
        </label>
        {quizMode && (
          <span className="badge badge-primary">
            {revealed.length} / {DIFFERENCES.length} revealed
          </span>
        )}
      </div>

      <div className="table-wrap">
        <table className="table jsx-diff-table">
          <thead>
            <tr>
              <th scope="col">HTML</th>
              <th scope="col">JSX</th>
              <th scope="col">Why</th>
            </tr>
          </thead>
          <tbody>
            {DIFFERENCES.map((row, index) => {
              const hidden = quizMode && !revealed.includes(index);
              return (
                <tr key={row.html}>
                  <td><code>{row.html}</code></td>
                  <td>
                    {hidden ? (
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => reveal(index)}>
                        <Eye size={14} aria-hidden="true" /> Reveal
                      </button>
                    ) : (
                      <code>{row.jsx}</code>
                    )}
                  </td>
                  <td className="small muted jsx-why">{row.why}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
