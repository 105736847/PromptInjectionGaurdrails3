/**
 * Code blocks, whitespace and special characters in JSX.
 *
 * - <pre> keeps spaces and line breaks exactly as written; <code> marks it as code.
 * - JSX trims whitespace at the start/end of lines and drops line breaks,
 *   so you sometimes need {' '} for a space or {'\n'} for a newline.
 * - HTML entities (&copy; &nbsp; &lt;) work in JSX text. Inside {…} you are in
 *   JavaScript, so write the character itself or a "\u00A9" escape instead.
 */
const snippet = `function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}`;

const specials = [
  { label: '&copy; entity', jsx: <>&copy; 2026 Team Nebula</> },
  { label: "{'©'} literal", jsx: <>{'©'} 2026 Team Nebula</> },
  { label: "{'\\u00A9'} escape", jsx: <>{'\u00A9'} 2026 Team Nebula</> },
  { label: '&lt;div&gt;', jsx: <>Type &lt;div&gt; to show a tag as text</> },
  { label: '&nbsp; (no break)', jsx: <>Due in 10&nbsp;days – never wraps between “10” and “days”</> },
  { label: '&mdash; &ndash; &hellip;', jsx: <>Weeks 1&ndash;6 &mdash; theory&hellip;</> },
  { label: '&rarr; &times; &deg;', jsx: <>2 &times; 3 &rarr; 6, and it is 18&deg;C</> },
  {
    label: 'emoji + role="img"',
    jsx: (
      <>
        Great work <span role="img" aria-label="party popper">🎉</span> – A+ <span role="img" aria-label="star">⭐</span>
      </>
    ),
  },
];

export default function CodeAndWhitespace() {
  const name = 'Alex';

  return (
    <div className="stack-lg">
      <div className="grid-2">
        <div className="stack-sm">
          <h4 className="m-0">&lt;pre&gt;&lt;code&gt; keeps formatting</h4>
          {/* The string's newlines and indentation are preserved by <pre> */}
          <pre className="demo-output">
            <code>{snippet}</code>
          </pre>
        </div>

        <div className="stack-sm">
          <h4 className="m-0">Whitespace in JSX</h4>
          <p className="m-0 small">
            Without a space: <strong>Hi</strong>
            {name}
          </p>
          <p className="m-0 small">
            With {"{' '}"}: <strong>Hi</strong>{' '}
            {name}
          </p>
          <pre className="demo-output m-0">
            {'Line one'}
            {'\n'}
            {'Line two, after {\'\\n\'} inside <pre>'}
          </pre>
          <p className="m-0 small muted">
            Long text in JSX
            that spans several lines
            becomes one line with single spaces.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Written as</th>
              <th scope="col">Renders as</th>
            </tr>
          </thead>
          <tbody>
            {specials.map((item) => (
              <tr key={item.label}>
                <td>
                  <code>{item.label}</code>
                </td>
                <td style={{ whiteSpace: 'normal' }}>{item.jsx}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
