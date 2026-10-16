/**
 * Tabs – an accessible tab widget built from scratch.
 *
 * - The PARENT owns the active tab ("controlled component"): <Tabs value onChange />.
 *   That is why the "Jump to Assessments" button outside the widget can change it.
 * - WAI-ARIA roles tablist / tab / tabpanel are linked together with ids from useId().
 * - "Roving tabindex": only the active tab is in the Tab order; the arrow keys
 *   (plus Home / End) move between tabs. Vertical tabs use ↑ / ↓ instead of ← / →.
 */
import { useId, useRef, useState } from 'react';
import styles from './Tabs.module.css';

function Tabs({ tabs, value, onChange, orientation = 'horizontal', label }) {
  const baseId = useId();
  const tabRefs = useRef([]); // DOM nodes of the tab buttons, so we can move focus
  const activeIndex = tabs.findIndex((tab) => tab.id === value);
  const vertical = orientation === 'vertical';

  function selectIndex(index) {
    const wrapped = (index + tabs.length) % tabs.length; // wrap around at both ends
    onChange(tabs[wrapped].id);
    tabRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(event) {
    const keyActions = {
      [vertical ? 'ArrowUp' : 'ArrowLeft']: () => selectIndex(activeIndex - 1),
      [vertical ? 'ArrowDown' : 'ArrowRight']: () => selectIndex(activeIndex + 1),
      Home: () => selectIndex(0),
      End: () => selectIndex(tabs.length - 1),
    };
    if (keyActions[event.key]) {
      event.preventDefault(); // stop the arrow keys from scrolling the page
      keyActions[event.key]();
    }
  }

  return (
    <div className={vertical ? styles.vertical : styles.horizontal}>
      <div role="tablist" aria-label={label} aria-orientation={orientation} className={styles.list} onKeyDown={handleKeyDown}>
        {tabs.map((tab, index) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={styles.tab}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Every panel is rendered, but only the active one is visible (hidden attribute). */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== value}
          tabIndex={0}
          className={styles.panel}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

const UNIT_TABS = [
  { id: 'overview', label: 'Overview', content: <p>COS30049 teaches you to plan and build a full-stack project in a team: a React front-end, a Python API and an ML model.</p> },
  { id: 'assessments', label: 'Assessments', content: <ul><li>Assignment 1 – Proposal (10%)</li><li>Assignment 2 – ML model (30%)</li><li>Assignment 3 – Full-stack app (40%)</li></ul> },
  { id: 'schedule', label: 'Schedule', content: <p>Lecture: Monday 10:30 · Lab: Wednesday 14:30 · Consultation: Friday 12:00.</p> },
  { id: 'resources', label: 'Resources', content: <p>Slides, lab sheets and recordings are released every Monday morning.</p> },
];

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', content: <p>Preferred name, pronouns and profile photo.</p> },
  { id: 'notifications', label: 'Notifications', content: <p>Email me when grades are released or a due date changes.</p> },
  { id: 'privacy', label: 'Privacy', content: <p>Choose who can see your group-project contributions.</p> },
];

export default function TabsDemo() {
  const [unitTab, setUnitTab] = useState('overview'); // lifted state – the parent decides
  const [settingsTab, setSettingsTab] = useState('profile');

  return (
    <div className="stack-lg">
      <Tabs label="Unit information" tabs={UNIT_TABS} value={unitTab} onChange={setUnitTab} />
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => setUnitTab('assessments')}>
          Jump to Assessments
        </button>
        <span className="small muted">
          Active tab (parent state): <code>{unitTab}</code>
        </span>
      </div>

      <Tabs label="Account settings" orientation="vertical" tabs={SETTINGS_TABS} value={settingsTab} onChange={setSettingsTab} />
    </div>
  );
}
