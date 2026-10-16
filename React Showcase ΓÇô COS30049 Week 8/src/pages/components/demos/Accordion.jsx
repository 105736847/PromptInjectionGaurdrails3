/**
 * Accordion – expandable FAQ sections.
 *
 * - State is an ARRAY of open ids, so the same code supports "one at a time"
 *   and "many at once" – only the toggle logic changes.
 * - Each header is a real <button> with aria-expanded + aria-controls.
 * - The smooth height animation is pure CSS (grid-template-rows: 0fr → 1fr),
 *   so we never have to measure heights in JavaScript.
 */
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Accordion.module.css';

const FAQ = [
  {
    id: 'extension',
    question: 'How do I apply for an extension?',
    answer: 'Submit an extension request through the unit site at least 24 hours before the due date and attach any supporting documents.',
  },
  {
    id: 'late',
    question: 'What is the late penalty?',
    answer: '10% of the available marks is deducted for each calendar day, up to five days. After that the submission receives zero.',
  },
  {
    id: 'groups',
    question: 'Can I change my project group?',
    answer: 'Group changes are possible until the end of Week 4. Talk to your tutor first so the other teams stay balanced.',
  },
  {
    id: 'ai',
    question: 'Am I allowed to use AI tools?',
    answer: 'Yes, as long as you declare how you used them in your report. You must still understand and be able to explain every line you submit.',
  },
];

export default function Accordion() {
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [openIds, setOpenIds] = useState(['extension']);
  const baseId = useId();

  function toggle(id) {
    setOpenIds((current) => {
      if (current.includes(id)) return current.filter((openId) => openId !== id); // close it
      return allowMultiple ? [...current, id] : [id]; // open it (and maybe close the others)
    });
  }

  function handleModeChange(event) {
    const multiple = event.target.checked;
    setAllowMultiple(multiple);
    if (!multiple) setOpenIds((current) => current.slice(0, 1)); // keep at most one open
  }

  return (
    <div className="stack">
      <label className="switch">
        <input type="checkbox" checked={allowMultiple} onChange={handleModeChange} />
        <span className="switch-track" />
        Allow several sections open at once
      </label>

      <div className={styles.accordion}>
        {FAQ.map((item) => {
          const open = openIds.includes(item.id);
          const buttonId = `${baseId}-button-${item.id}`;
          const panelId = `${baseId}-panel-${item.id}`;
          return (
            <div key={item.id} className={styles.item}>
              <h4 className={styles.heading}>
                <button
                  type="button"
                  id={buttonId}
                  className={styles.trigger}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(item.id)}
                >
                  {item.question}
                  <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
                </button>
              </h4>
              {/* The panel stays in the DOM so CSS can animate it closed.
                  `inert` removes the hidden content from the Tab order and screen readers. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={styles.panel}
                data-open={open}
                inert={!open}
              >
                <div className={styles.panelInner}>
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
