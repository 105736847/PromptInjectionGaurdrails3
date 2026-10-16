import { useId, useState } from 'react';
import CodeBlock from '../../../components/common/CodeBlock.jsx';
import { Segmented, Slider } from './Controls.jsx';
import './GridPlayground.css';

/**
 * GridPlayground – CSS Grid places items in rows AND columns at the same time.
 * `grid-template-columns` defines the column tracks; items flow into the
 * cells one by one and can span several tracks.
 *
 * The free-text field is checked with the browser's own CSS parser,
 * CSS.supports(), so a typo never breaks the preview.
 */
const PRESETS = [
  'repeat(3, 1fr)',
  '200px 1fr',
  '1fr 2fr 1fr',
  'repeat(4, 1fr)',
  '100px repeat(2, 1fr)',
  'repeat(auto-fit, minmax(120px, 1fr))',
];

const isValidColumns = (value) => CSS.supports('grid-template-columns', value);

export default function GridPlayground() {
  const [draft, setDraft] = useState(PRESETS[0]); // what is typed in the text field
  const [columns, setColumns] = useState(PRESETS[0]); // last VALID value – used by the preview
  const [gap, setGap] = useState(10);
  const [count, setCount] = useState(7);
  const [dense, setDense] = useState(false);
  const [spans, setSpans] = useState({ 1: { col: 2, row: 1 }, 4: { col: 1, row: 2 } });
  const [selected, setSelected] = useState(1);
  const inputId = useId();

  const activeItem = Math.min(selected, count); // the selected item may have been removed
  const spanOf = (n) => spans[n] ?? { col: 1, row: 1 };
  const draftIsValid = isValidColumns(draft);

  function handleDraftChange(event) {
    const value = event.target.value;
    setDraft(value);
    if (isValidColumns(value)) setColumns(value);
  }

  function choosePreset(value) {
    setDraft(value);
    setColumns(value);
  }

  function updateSpan(key) {
    return (value) =>
      setSpans((prev) => ({ ...prev, [activeItem]: { col: 1, row: 1, ...prev[activeItem], [key]: value } }));
  }

  const itemRules = Object.entries(spans)
    .filter(([n, span]) => Number(n) <= count && (span.col > 1 || span.row > 1))
    .map(([n, span]) => `.item-${n} { grid-column: span ${span.col}; grid-row: span ${span.row}; }`);

  const css = `.grid {
  display: grid;
  grid-template-columns: ${columns};
  grid-auto-rows: minmax(64px, auto);${dense ? '\n  grid-auto-flow: row dense;' : ''}
  gap: ${gap}px;
}
${itemRules.join('\n')}`;

  return (
    <div className="layout-pg">
      <div className="layout-pg-controls">
        <div className="field">
          <label className="layout-control-label" htmlFor={inputId}>grid-template-columns</label>
          <input
            id={inputId}
            className="input mono"
            value={draft}
            onChange={handleDraftChange}
            aria-invalid={!draftIsValid}
            spellCheck={false}
          />
          {!draftIsValid && <p className="error-text">Not valid CSS yet – the preview keeps the last valid value.</p>}
        </div>
        <div className="layout-grid-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="btn btn-sm mono"
              aria-pressed={preset === columns}
              onClick={() => choosePreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
        <Slider label="gap" value={gap} onChange={setGap} max={32} unit="px" />
        <Slider label="number of items" value={count} onChange={setCount} min={1} max={12} />
        <label className="switch">
          <input type="checkbox" checked={dense} onChange={(event) => setDense(event.target.checked)} />
          <span className="switch-track" />
          <span className="mono small">grid-auto-flow: dense</span>
        </label>
        <p className="m-0 small">
          Item <strong className="mono">{activeItem}</strong> selected – click a cell to pick another.
        </p>
        <Segmented label="grid-column: span" options={[1, 2, 3, 4]} value={spanOf(activeItem).col} onChange={updateSpan('col')} />
        <Segmented label="grid-row: span" options={[1, 2, 3]} value={spanOf(activeItem).row} onChange={updateSpan('row')} />
      </div>

      <div className="layout-pg-preview">
        <div
          className="layout-stage layout-grid-stage"
          style={{
            gridTemplateColumns: columns,
            gridAutoFlow: dense ? 'row dense' : 'row',
            gap,
          }}
        >
          {Array.from({ length: count }, (_, i) => {
            const n = i + 1;
            const span = spanOf(n);
            return (
              <button
                key={n}
                type="button"
                className="layout-item layout-grid-item"
                aria-pressed={n === activeItem}
                onClick={() => setSelected(n)}
                style={{
                  '--item-color': `var(--chart-${(i % 6) + 1})`,
                  gridColumn: `span ${span.col}`,
                  gridRow: `span ${span.row}`,
                }}
              >
                {n}
                {(span.col > 1 || span.row > 1) && <small>{span.col}×{span.row}</small>}
              </button>
            );
          })}
        </div>
        <CodeBlock code={css} filename="grid.css" />
      </div>
    </div>
  );
}
