/**
 * JsxToObject – proof that JSX is "just JavaScript".
 *
 * Every JSX tag becomes a function call that returns a plain object
 * (a "React element") with a `type` and `props`. React reads these objects
 * to decide what to put on the screen. Pick an example and inspect it.
 */
import { isValidElement, useState } from 'react';

function Badge({ label }) {
  return <span className="badge badge-primary">{label}</span>;
}

function handleEnrol() {
  // not called in this demo – it only shows up as a prop value
}

const EXAMPLES = {
  heading: { label: 'A heading', element: <h2 className="title">Hello, COS30049!</h2> },
  button: { label: 'A button with an event', element: <button type="button" className="btn" onClick={handleEnrol}>Enrol</button> },
  nested: {
    label: 'Nested elements',
    element: (
      <ul className="units">
        <li>COS30049</li>
        <li>COS30045</li>
      </ul>
    ),
  },
  component: { label: 'Your own component', element: <Badge label="New" /> },
};

// Turn a React element into a readable plain object (functions → their name).
// (In a minified production build function names get shortened, e.g. ƒ a.)
function describe(node) {
  if (Array.isArray(node)) return node.map(describe);
  if (typeof node === 'function') return `ƒ ${node.name}()`;
  if (!isValidElement(node)) return node; // strings, numbers…

  const props = {};
  for (const [name, value] of Object.entries(node.props)) {
    props[name] = describe(value);
  }
  return {
    type: typeof node.type === 'string' ? node.type : `ƒ ${node.type.name}`, // 'h2' or a component function
    props,
  };
}

export default function JsxToObject() {
  const [choice, setChoice] = useState('heading');
  const { element } = EXAMPLES[choice];

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Choose an example">
        {Object.entries(EXAMPLES).map(([key, example]) => (
          <button
            key={key}
            type="button"
            className={`btn btn-sm ${choice === key ? 'btn-primary' : ''}`}
            aria-pressed={choice === key}
            onClick={() => setChoice(key)}
          >
            {example.label}
          </button>
        ))}
      </div>

      <div className="grid-2">
        <div className="stack-sm">
          <span className="label">Rendered result</span>
          <div className="card card-subtle jsx-rendered">{element}</div>
        </div>
        <div className="stack-sm">
          <span className="label">The object React receives</span>
          <pre className="demo-output">{JSON.stringify(describe(element), null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
