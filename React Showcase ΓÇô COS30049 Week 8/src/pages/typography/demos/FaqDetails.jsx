import { useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import styles from './FaqDetails.module.css';

/**
 * <details> + <summary>: a native, keyboard-accessible disclosure widget.
 * Works with ZERO JavaScript – but here React also controls it:
 *
 * - `open` is driven by state, so buttons can expand/collapse everything.
 * - `onToggle` fires after the browser opens/closes it (e.g. the user clicked
 *   the summary). We copy the new value back into state to stay in sync.
 */
const faqs = [
  { id: 'team', q: 'How many students are in an Assignment 3 team?', a: 'Teams have three to four members. Register your team with your tutor by the end of Week 8.' },
  { id: 'stack', q: 'Do we have to use React?', a: 'The front-end must be built with a modern framework; React is the one covered in class and the one your tutors can help with the most.' },
  { id: 'api', q: 'How does React talk to the FastAPI back-end?', a: 'With fetch() (or axios) calls to your API endpoints. The JSON response is stored in state and rendered.' },
  { id: 'mui', q: 'Can we use a UI library such as MUI?', a: 'Yes. Libraries save time, but you should still understand the components and props you are using.' },
  { id: 'late', q: 'What happens if we submit late?', a: 'Late penalties follow the unit outline. Talk to your tutor early if something is going wrong.' },
];

export default function FaqDetails() {
  // Which items are open: { team: true, api: false, … }
  const [openItems, setOpenItems] = useState({ team: true });

  const openCount = faqs.filter((f) => openItems[f.id]).length;

  function setAll(isOpen) {
    setOpenItems(Object.fromEntries(faqs.map((f) => [f.id, isOpen])));
  }

  function handleToggle(id, event) {
    const isOpen = event.currentTarget.open; // the browser's new value
    setOpenItems((prev) => (prev[id] === isOpen ? prev : { ...prev, [id]: isOpen }));
  }

  return (
    <div className="stack">
      <div className="row-between">
        <span className="muted small" aria-live="polite">
          {openCount} of {faqs.length} answers open
        </span>
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => setAll(true)} disabled={openCount === faqs.length}>
            <ChevronsUpDown size={15} aria-hidden="true" /> Expand all
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setAll(false)} disabled={openCount === 0}>
            <ChevronsDownUp size={15} aria-hidden="true" /> Collapse all
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className={styles.item}
            open={Boolean(openItems[faq.id])}
            onToggle={(event) => handleToggle(faq.id, event)}
          >
            <summary className={styles.summary}>{faq.q}</summary>
            <p className={styles.answer}>{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
