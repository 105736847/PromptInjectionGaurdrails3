import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import CodeBlock from '../../../components/common/CodeBlock.jsx';
import { Segmented, Slider } from './Controls.jsx';
import './FlexPlayground.css';

/**
 * FlexPlayground – experiment with the properties of a flex CONTAINER.
 *
 * All settings live in ONE state object, which is used twice:
 *   1. as the inline `style` of the live preview, and
 *   2. to generate the CSS text you can copy.
 * One source of truth → the preview and the code can never disagree.
 */
const OPTIONS = {
  flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
  justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
  alignItems: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
  flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
};
const ALIGN_CONTENT = ['normal', 'flex-start', 'center', 'flex-end', 'space-between', 'stretch'];

const INITIAL = {
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  flexWrap: 'nowrap',
  alignContent: 'normal',
  gap: 12,
};

const PRESETS = {
  Navbar: { ...INITIAL, justifyContent: 'space-between', alignItems: 'center' },
  'Perfect centre': { ...INITIAL, justifyContent: 'center', alignItems: 'center' },
  'Vertical stack': { ...INITIAL, flexDirection: 'column' },
  'Tag cloud': { ...INITIAL, flexWrap: 'wrap', alignItems: 'flex-start', alignContent: 'flex-start', gap: 8 },
};

// Different font sizes make the items different heights, so align-items is visible.
const FONT_SIZES = [1, 1.6, 0.9, 1.3, 2, 1.1, 1.45, 0.95, 1.7, 1.2];

// 'justifyContent' → 'justify-content'
const toKebab = (name) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

export default function FlexPlayground() {
  const [container, setContainer] = useState(INITIAL);
  const [count, setCount] = useState(5);

  // update('gap') returns a new function that changes just that one property.
  const update = (property) => (value) => setContainer((prev) => ({ ...prev, [property]: value }));

  // Derived data: computed during render, never stored in extra state.
  const { alignContent, ...rest } = container;
  const isWrapping = container.flexWrap !== 'nowrap';
  const style = { display: 'flex', ...rest }; // gap: 12 → React adds "px" for us
  if (isWrapping) style.alignContent = alignContent; // only matters with several lines

  const css = [
    '.container {',
    ...Object.entries(style).map(
      ([prop, value]) => `  ${toKebab(prop)}: ${typeof value === 'number' ? `${value}px` : value};`,
    ),
    '}',
  ].join('\n');

  return (
    <div className="layout-pg">
      <div className="layout-pg-controls">
        {Object.entries(OPTIONS).map(([property, options]) => (
          <Segmented
            key={property}
            label={toKebab(property)}
            options={options}
            value={container[property]}
            onChange={update(property)}
          />
        ))}
        {isWrapping && (
          <Segmented label="align-content" options={ALIGN_CONTENT} value={alignContent} onChange={update('alignContent')} />
        )}
        <Slider label="gap" value={container.gap} onChange={update('gap')} max={40} unit="px" />
        <Slider label="number of items" value={count} onChange={setCount} min={1} max={10} />
      </div>

      <div className="layout-pg-preview">
        <div className="row">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button key={name} type="button" className="btn btn-secondary btn-sm" onClick={() => setContainer(preset)}>
              {name}
            </button>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setContainer(INITIAL)}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* The inline style object built above is applied right here */}
        <div className="layout-stage layout-flex-stage" style={style}>
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="layout-item layout-flex-item"
              style={{ '--item-color': `var(--chart-${(i % 6) + 1})`, fontSize: `${FONT_SIZES[i]}rem` }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <p className="hint">
          Drag the corner of the dashed box to resize it – try that with <code>flex-wrap: wrap</code>.
        </p>
        <CodeBlock code={css} filename="flex-container.css" />
      </div>
    </div>
  );
}
