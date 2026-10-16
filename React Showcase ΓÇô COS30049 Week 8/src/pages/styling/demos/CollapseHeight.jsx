import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './CollapseHeight.css';

/**
 * CollapseHeight – CSS cannot transition `height: 0` → `height: auto`
 * (the panel just snaps open). The modern trick: make the panel a grid
 * with ONE row and animate that row from 0fr to 1fr instead.
 *
 *   .panel         { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .35s; }
 *   .panel.is-open { grid-template-rows: 1fr; }
 *   .panel > div   { overflow: hidden; }
 *
 * Switch the trick off to compare. Closed panels get `inert`, so their
 * content cannot be focused or read by screen readers while hidden.
 */
const FAQ = [
  {
    question: 'When is Assignment 3 due?',
    answer: 'Friday of Week 12 at 11:59 pm. Late submissions lose 10% per day unless you have an approved extension.',
  },
  {
    question: 'Can we use a UI library like MUI?',
    answer:
      'Yes. Any library is fine as long as you can explain your code. Many teams use MUI for forms and tables and plain CSS for the rest of the layout.',
  },
  {
    question: 'How do we connect React to FastAPI?',
    answer:
      'Call your API with fetch() inside an event handler or an effect, enable CORS in FastAPI for the Vite dev server origin, and show loading and error states while you wait.',
  },
];

function FaqItem({ question, answer, isOpen, onToggle, useGridTrick }) {
  const id = useId();
  const panelClass = `styling-collapse ${useGridTrick ? 'uses-grid' : 'uses-height'} ${isOpen ? 'is-open' : ''}`;

  return (
    <div className="styling-faq-item">
      <h4 className="m-0">
        <button
          type="button"
          id={`${id}-button`}
          className="styling-faq-button"
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
        >
          {question}
          <ChevronDown size={18} className="styling-faq-chevron" aria-hidden="true" />
        </button>
      </h4>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-button`} className={panelClass} inert={!isOpen}>
        <div className="styling-collapse-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function CollapseHeight() {
  const [openIndex, setOpenIndex] = useState(0); // one panel open at a time (-1 = none)
  const [useGridTrick, setUseGridTrick] = useState(true);

  return (
    <div className="stack">
      <label className="switch">
        <input type="checkbox" checked={useGridTrick} onChange={(event) => setUseGridTrick(event.target.checked)} />
        <span className="switch-track" />
        Use the <code>grid-template-rows: 0fr → 1fr</code> trick
      </label>

      <div className="styling-faq">
        {FAQ.map((item, index) => (
          <FaqItem
            key={item.question}
            {...item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            useGridTrick={useGridTrick}
          />
        ))}
      </div>
    </div>
  );
}
