import { useId, useState } from 'react';
import './ZIndexStacking.css';

/**
 * ZIndexStacking – z-index decides which POSITIONED element is painted on top.
 *
 * The catch: z-index values only compete inside the same "stacking context".
 * A parent with position + z-index (or opacity < 1, transform, filter,
 * isolation: isolate …) starts a new context, and its children can never
 * rise above the parent's own level – not even with z-index: 999.
 */
const CARDS = [
  { id: 'a', label: 'A · navbar', color: 'var(--chart-1)', left: '3%', top: 16 },
  { id: 'b', label: 'B · modal', color: 'var(--chart-2)', left: '23%', top: 58 },
  { id: 'c', label: 'C · tooltip', color: 'var(--chart-4)', left: '43%', top: 100 },
];

function Card({ card, zIndex }) {
  return (
    <div className="layout-z-card" style={{ '--item-color': card.color, left: card.left, top: card.top, zIndex }}>
      <strong>{card.label}</strong>
      <code>z-index: {zIndex}</code>
    </div>
  );
}

export default function ZIndexStacking() {
  // Keep the raw TEXT of each input, so you can clear it or type "-" first;
  // convert to a number only where it is used.
  const [zIndexes, setZIndexes] = useState({ a: '1', b: '2', c: '3' });
  const [trapped, setTrapped] = useState(false);
  const idPrefix = useId();
  const zOf = (id) => Number(zIndexes[id]) || 0;

  function handleChange(id, value) {
    setZIndexes((prev) => ({ ...prev, [id]: value }));
  }

  const [cardA, cardB, cardC] = CARDS;
  const tooltip = <Card card={cardC} zIndex={zOf('c')} />;

  return (
    <div className="stack">
      <div className="row">
        {CARDS.map((card) => (
          <div key={card.id} className="field layout-z-field">
            <label className="label" htmlFor={`${idPrefix}-${card.id}`}>{card.label}</label>
            <input
              id={`${idPrefix}-${card.id}`}
              className="input"
              type="number"
              min={-1}
              max={999}
              value={zIndexes[card.id]}
              onChange={(event) => handleChange(card.id, event.target.value)}
            />
          </div>
        ))}
      </div>

      <label className="switch">
        <input type="checkbox" checked={trapped} onChange={(event) => setTrapped(event.target.checked)} />
        <span className="switch-track" />
        Put C inside a positioned parent with <code>z-index: 1</code>
      </label>

      <div className="layout-z-stage">
        <Card card={cardA} zIndex={zOf('a')} />
        <Card card={cardB} zIndex={zOf('b')} />
        {trapped ? (
          <div className="layout-z-trap">
            <span className="layout-z-trap-label">parent · z-index: 1 (new stacking context)</span>
            {tooltip}
          </div>
        ) : (
          tooltip
        )}
      </div>

      {trapped && zOf('b') > 1 && (
        <div className="alert alert-warning">
          C is trapped: its parent has z-index 1, which is lower than B’s {zOf('b')}. Try giving C 999 – it still
          stays under B.
        </div>
      )}
    </div>
  );
}
