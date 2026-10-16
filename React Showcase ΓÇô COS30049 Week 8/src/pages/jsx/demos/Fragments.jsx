/**
 * Fragments – a component must return ONE element. When you don't want an
 * extra <div> in the page, wrap the siblings in a Fragment instead:
 *
 *   <> … </>                      short syntax (most common)
 *   <Fragment key={id}> … </Fragment>   long syntax – needed when you map() and need a key
 *
 * Toggle the switch to see why an extra <div> can break a CSS Grid layout.
 */
import { Fragment, useState } from 'react';

function Stat({ label, value }) {
  return (
    <div className="jsx-stat">
      <span className="small muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// ✅ The three <Stat>s become DIRECT children of the grid – no extra DOM node.
function StatsWithFragment() {
  return (
    <>
      <Stat label="Units this semester" value={4} />
      <Stat label="Credit points" value={50} />
      <Stat label="Weighted average" value="76.4" />
    </>
  );
}

// ❌ An extra wrapper <div>: the grid now has ONE child, so the columns collapse.
function StatsWithDiv() {
  return (
    <div>
      <Stat label="Units this semester" value={4} />
      <Stat label="Credit points" value={50} />
      <Stat label="Weighted average" value="76.4" />
    </div>
  );
}

const GLOSSARY = [
  { term: 'Component', definition: 'A function that returns JSX.' },
  { term: 'Props', definition: 'The inputs a parent passes to a component.' },
  { term: 'State', definition: 'Data a component remembers between renders.' },
];

export default function Fragments() {
  const [useFragment, setUseFragment] = useState(true);

  return (
    <div className="stack-lg">
      <div className="stack">
        <label className="switch">
          <input type="checkbox" checked={useFragment} onChange={(e) => setUseFragment(e.target.checked)} />
          <span className="switch-track" />
          <span>Use a Fragment (<code>{useFragment ? '<>…</>' : '<div>…</div>'}</code>)</span>
        </label>
        <div className="jsx-stat-grid">
          {useFragment ? <StatsWithFragment /> : <StatsWithDiv />}
        </div>
        <p className="hint">
          The grid has 3 columns. {useFragment
            ? 'Each <Stat> fills one column.'
            : 'The extra <div> is the only grid item, so everything is squeezed into the first column.'}
        </p>
      </div>

      <div className="stack-sm">
        <h4 className="m-0">Fragment with a key</h4>
        <p className="small muted m-0">
          A <code>&lt;dl&gt;</code> must contain <code>&lt;dt&gt;</code>/<code>&lt;dd&gt;</code> pairs directly –
          a wrapper <code>&lt;div&gt;</code> per pair would be invalid HTML.
        </p>
        <dl className="jsx-glossary">
          {GLOSSARY.map((item) => (
            // The short syntax <>…</> cannot take a key, so use <Fragment key={…}>.
            <Fragment key={item.term}>
              <dt>{item.term}</dt>
              <dd>{item.definition}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
}
