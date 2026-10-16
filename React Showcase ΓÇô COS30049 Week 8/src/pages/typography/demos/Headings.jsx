import { useState } from 'react';

/**
 * Headings & paragraphs rendered from data.
 *
 * - h1–h6 describe the OUTLINE of a page (like a table of contents), not
 *   font sizes. Screen-reader users jump between headings to skim a page.
 * - A tag name can be stored in a variable: `const Tag = 'h3'` → <Tag>.
 *   The variable must start with a capital letter, otherwise JSX treats
 *   it as an HTML tag called "tag".
 */
const headings = [
  { level: 1, text: 'COS30049 Computing Technology Innovation Project', use: 'Page title – exactly one per page' },
  { level: 2, text: 'Assignment 3: Full-stack AI web app', use: 'Main sections' },
  { level: 3, text: 'Front-end requirements', use: 'Sub-sections' },
  { level: 4, text: 'Data visualisation', use: 'Deeper levels…' },
  { level: 5, text: 'Chart accessibility', use: 'Rarely needed' },
  { level: 6, text: 'Colour contrast checklist', use: 'Very rarely needed' },
];

const paragraphs = [
  'Your team will build a React front-end that talks to a FastAPI back-end serving a trained machine-learning model.',
  'Each paragraph in this list is rendered by calling map() on an array of strings – the same way you would render data that arrives from an API.',
  'Never skip heading levels just to get a smaller font. Choose the level that fits the outline, then style it with CSS.',
];

export default function Headings() {
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="stack">
      <label className="switch">
        <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
        <span className="switch-track" />
        Show tag labels
      </label>

      <div className="stack-sm">
        {headings.map(({ level, text, use }) => {
          // Pick the element type at runtime. Capitalised → JSX treats it as a component/tag variable.
          const Tag = `h${level}`;
          return (
            <div key={level} className="row" style={{ alignItems: 'baseline' }}>
              {showLabels && <span className="badge badge-code">&lt;h{level}&gt;</span>}
              <Tag className="m-0">{text}</Tag>
              {showLabels && <span className="subtle small">{use}</span>}
            </div>
          );
        })}
      </div>

      <hr className="m-0" />

      {/* index is an acceptable key ONLY because this list never changes order */}
      {paragraphs.map((text, index) => (
        <p key={index} className="m-0">
          {showLabels && <span className="badge badge-code">&lt;p&gt;</span>} {text}
        </p>
      ))}
    </div>
  );
}
