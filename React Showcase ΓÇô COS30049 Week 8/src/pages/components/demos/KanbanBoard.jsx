/**
 * KanbanBoard – group-assignment tasks you can drag between columns.
 *
 * - ONE array of cards is the single source of truth; each card knows its
 *   `column`. Columns and their counts are derived with filter().
 * - HTML5 drag and drop: draggable + onDragStart (remember the card id),
 *   onDragOver (preventDefault = "dropping is allowed here") and onDrop.
 * - Drag and drop does not work with a keyboard, so every card also has
 *   ← / → buttons – always offer an accessible alternative.
 */
import { useId, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import styles from './KanbanBoard.module.css';

const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress' },
  { id: 'done', title: 'Done' },
];

const INITIAL_CARDS = [
  { id: 'c1', title: 'Design wireframes in Figma', owner: 'AK', column: 'done' },
  { id: 'c2', title: 'Set up FastAPI /predict endpoint', owner: 'MN', column: 'doing' },
  { id: 'c3', title: 'Build React upload form', owner: 'JL', column: 'doing' },
  { id: 'c4', title: 'Write model evaluation section', owner: 'SP', column: 'todo' },
  { id: 'c5', title: 'Record 5-minute demo video', owner: 'AK', column: 'todo' },
];

export default function KanbanBoard() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const id = useId();

  function moveCard(cardId, column) {
    setCards((current) => current.map((card) => (card.id === cardId ? { ...card, column } : card)));
  }

  function moveBy(card, step) {
    const index = COLUMNS.findIndex((col) => col.id === card.column) + step;
    if (COLUMNS[index]) moveCard(card.id, COLUMNS[index].id);
  }

  function handleDrop(event, column) {
    event.preventDefault();
    moveCard(event.dataTransfer.getData('text/plain'), column);
    setOverColumn(null);
  }

  function addCard(event) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setCards((current) => [...current, { id: `card-${Date.now()}`, title: newTitle.trim(), owner: 'ME', column: 'todo' }]);
    setNewTitle('');
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={addCard}>
        <label className="visually-hidden" htmlFor={`${id}-new`}>New task</label>
        <input id={`${id}-new`} className="input" style={{ flex: '1 1 220px' }} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New task, e.g. Test API with Postman" />
        <button type="submit" className="btn btn-primary" disabled={!newTitle.trim()}>
          <Plus size={16} aria-hidden="true" /> Add to “To do”
        </button>
      </form>

      <div className={styles.board}>
        {COLUMNS.map((column, columnIndex) => {
          const columnCards = cards.filter((card) => card.column === column.id);
          return (
            <section
              key={column.id}
              className={styles.column}
              data-over={overColumn === column.id}
              aria-labelledby={`${id}-${column.id}`}
              onDragOver={(event) => {
                event.preventDefault(); // without this the browser refuses the drop
                setOverColumn(column.id);
              }}
              onDragLeave={(event) => {
                // dragleave also fires when moving over a child element – ignore those
                if (!event.currentTarget.contains(event.relatedTarget)) setOverColumn(null);
              }}
              onDrop={(event) => handleDrop(event, column.id)}
            >
              <h4 id={`${id}-${column.id}`} className={styles.columnTitle}>
                {column.title} <span className="badge">{columnCards.length}</span>
              </h4>
              <ul className={styles.cards}>
                {columnCards.map((card) => (
                  <li
                    key={card.id}
                    className={styles.card}
                    data-dragging={draggingId === card.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', card.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggingId(card.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverColumn(null);
                    }}
                  >
                    <span className={styles.cardTitle}>{card.title}</span>
                    <div className={styles.cardFooter}>
                      <span className="avatar" style={{ width: 26, height: 26, fontSize: '0.65rem' }}>
                        <span className="visually-hidden">Owner:</span> {card.owner}
                      </span>
                      <div className={styles.cardActions}>
                        <button type="button" className="btn-icon" onClick={() => moveBy(card, -1)} disabled={columnIndex === 0} aria-label={`Move “${card.title}” left`}>
                          <ArrowLeft size={14} />
                        </button>
                        <button type="button" className="btn-icon" onClick={() => moveBy(card, 1)} disabled={columnIndex === COLUMNS.length - 1} aria-label={`Move “${card.title}” right`}>
                          <ArrowRight size={14} />
                        </button>
                        <button type="button" className="btn-icon" onClick={() => setCards((current) => current.filter((c) => c.id !== card.id))} aria-label={`Delete “${card.title}”`}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {columnCards.length === 0 && <li className={styles.empty}>Drop tasks here</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
