import { useState } from 'react';

/**
 * Lists generated from data: <ul>, <ol>, nested lists and <dl>.
 *
 * - <ol> attributes: start (first number), reversed (count down) and
 *   type ("1", "a", "A", "i", "I"). In JSX they are normal props.
 * - Nested lists: a <ul> goes INSIDE an <li>, never directly inside a <ul>.
 * - <dl> is a description list: <dt> term + <dd> description.
 */
const toolkit = ['Node.js 20+', 'VS Code', 'Git + GitHub', 'A modern browser with React DevTools'];
const steps = ['Clone the repository', 'npm install', 'npm start', 'Open http://localhost:3000', 'Edit src/App.jsx'];

const semester = [
  { week: 'Week 7', topics: ['Python back-end', 'FastAPI routes'] },
  { week: 'Week 8', topics: ['React components', 'State & events', 'Forms'] },
  { week: 'Week 9', topics: ['Connecting to the API', 'Charts'] },
];

const glossary = [
  { term: 'Component', definition: 'A function that returns JSX. The building block of every React UI.' },
  { term: 'Props', definition: 'Read-only inputs passed from a parent component to a child.' },
  { term: 'State', definition: 'Data a component remembers between renders. Changing it re-renders the component.' },
  { term: 'Hook', definition: 'A function starting with "use" that lets a component use React features.' },
  { term: 'Virtual DOM', definition: 'React’s in-memory description of the UI, compared against the previous one to find changes.' },
];

export default function Lists() {
  const [start, setStart] = useState(1);
  const [reversed, setReversed] = useState(false);
  const [type, setType] = useState('1');

  return (
    <div className="grid-2">
      <div className="stack">
        <div>
          <h4>Unordered list &lt;ul&gt;</h4>
          <ul>
            {toolkit.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Ordered list &lt;ol&gt;</h4>
          <div className="row small mb-1">
            <label className="row" style={{ gap: 6 }}>
              start
              <input className="input" type="number" style={{ width: 72, height: 32 }} value={start}
                onChange={(e) => setStart(Number(e.target.value))} />
            </label>
            <label className="row" style={{ gap: 6 }}>
              type
              <select className="input" style={{ width: 70, height: 32 }} value={type} onChange={(e) => setType(e.target.value)}>
                {['1', 'a', 'A', 'i', 'I'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={reversed} onChange={(e) => setReversed(e.target.checked)} /> reversed
            </label>
          </div>
          <ol start={start} reversed={reversed} type={type}>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <code className="small">{`<ol start={${start}} type="${type}"${reversed ? ' reversed' : ''}>`}</code>
        </div>
      </div>

      <div className="stack">
        <div>
          <h4>Nested lists</h4>
          <ul>
            {semester.map(({ week, topics }) => (
              <li key={week}>
                <strong>{week}</strong>
                {/* The inner list lives inside the <li> */}
                <ul>
                  {topics.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Description list &lt;dl&gt; – React glossary</h4>
          <dl className="m-0">
            {glossary.map(({ term, definition }) => (
              // A <div> may group each dt/dd pair – handy for the key and for styling.
              <div key={term} className="mb-1">
                <dt style={{ fontWeight: 600 }}>{term}</dt>
                <dd className="muted small" style={{ marginLeft: 16 }}>{definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
