import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Segmented, Slider } from './Controls.jsx';
import './FlexItemEditor.css';

/**
 * FlexItemEditor – the properties that belong to flex ITEMS (the children):
 * flex-grow, flex-shrink, flex-basis, order and align-self.
 *
 * The items live in an array in state. Clicking an item stores its id as
 * `selectedId`; the controls then edit only that item with an immutable
 * update: map() over the array, copy the one we change, keep the rest.
 */
const START_ITEMS = ['A', 'B', 'C', 'D'].map((label, index) => ({
  id: index + 1,
  label,
  grow: 0,
  shrink: 1,
  basis: '120px',
  order: 0,
  alignSelf: 'auto',
}));

const GROW = [0, 1, 2, 3];
const SHRINK = [0, 1, 2, 3];
const BASIS = ['auto', '0', '80px', '120px', '200px', '30%'];
const ORDER = [-1, 0, 1, 2];
const ALIGN_SELF = ['auto', 'flex-start', 'center', 'flex-end', 'stretch'];

export default function FlexItemEditor() {
  const [items, setItems] = useState(START_ITEMS);
  const [selectedId, setSelectedId] = useState(2);
  const [containerWidth, setContainerWidth] = useState(100);

  // Derived: find the selected item instead of storing a copy of it in state.
  const selected = items.find((item) => item.id === selectedId);

  function updateSelected(property) {
    return (value) =>
      setItems((prev) => prev.map((item) => (item.id === selectedId ? { ...item, [property]: value } : item)));
  }

  function reset() {
    setItems(START_ITEMS);
    setContainerWidth(100);
  }

  return (
    <div className="layout-pg">
      <div className="layout-pg-controls">
        <p className="m-0 small">
          Editing item <strong className="mono">{selected.label}</strong> – click another box to switch.
        </p>
        <Segmented label="flex-grow" options={GROW} value={selected.grow} onChange={updateSelected('grow')} />
        <Segmented label="flex-shrink" options={SHRINK} value={selected.shrink} onChange={updateSelected('shrink')} />
        <Segmented label="flex-basis" options={BASIS} value={selected.basis} onChange={updateSelected('basis')} />
        <Segmented label="order" options={ORDER} value={selected.order} onChange={updateSelected('order')} />
        <Segmented label="align-self" options={ALIGN_SELF} value={selected.alignSelf} onChange={updateSelected('alignSelf')} />
        <Slider label="container width" value={containerWidth} onChange={setContainerWidth} min={30} max={100} unit="%" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
          <RotateCcw size={14} /> Reset all items
        </button>
      </div>

      <div className="layout-pg-preview">
        {/* Static styles live in the CSS file; only values that come from state are inline. */}
        <div className="layout-stage layout-fie-stage" style={{ width: `${containerWidth}%` }}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="layout-item layout-fie-item"
              aria-pressed={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
              style={{
                '--item-color': `var(--chart-${index + 1})`,
                flex: `${item.grow} ${item.shrink} ${item.basis}`, // grow shrink basis
                order: item.order,
                alignSelf: item.alignSelf,
              }}
            >
              <span className="layout-fie-label">{item.label}</span>
              <span className="layout-fie-flex">
                {item.grow} {item.shrink} {item.basis}
              </span>
            </button>
          ))}
        </div>

        <pre className="demo-output">
          {`.item-${selected.label.toLowerCase()} {
  flex: ${selected.grow} ${selected.shrink} ${selected.basis}; /* grow shrink basis */
  order: ${selected.order};
  align-self: ${selected.alignSelf};
}`}
        </pre>
        <ul className="small muted m-0">
          <li><strong>grow</strong> – how much of the <em>leftover</em> space the item takes (relative to the others).</li>
          <li><strong>shrink</strong> – how much it gives up when space is short (0 = never shrink). Lower the width to see it.</li>
          <li><strong>basis</strong> – the starting size before growing/shrinking. <code>flex: 1</code> means <code>1 1 0%</code>.</li>
          <li><strong>order</strong> changes only the visual order – screen readers and Tab still follow the HTML order.</li>
        </ul>
      </div>
    </div>
  );
}
