/**
 * Composition – building components out of other components.
 *
 * - `children` is a special prop: whatever you put BETWEEN the opening and
 *   closing tags (<Panel>…</Panel>) arrives as props.children.
 * - "Slots": you can pass JSX through ordinary props too (actions, footer),
 *   so one Panel component can be filled in many different ways.
 */
import { useState } from 'react';
import { Bell, CalendarDays, CheckCheck } from 'lucide-react';

// A generic container. It doesn't know (or care) what goes inside it.
function Panel({ title, icon, actions, footer, children }) {
  return (
    <section className="jsx-panel">
      <header className="jsx-panel-header">
        <h4 className="m-0 row">{icon}{title}</h4>
        {actions && <div className="row">{actions}</div>}
      </header>
      <div className="jsx-panel-body">{children}</div>
      {footer && <footer className="jsx-panel-footer">{footer}</footer>}
    </section>
  );
}

const ANNOUNCEMENTS = [
  { id: 1, text: 'Assignment 3 brief released' },
  { id: 2, text: 'Lab 8 moved to room ATC 325' },
  { id: 3, text: 'Guest lecture on MLOps next week' },
];

export default function Composition() {
  const [readIds, setReadIds] = useState([]);
  const [showBrief, setShowBrief] = useState(false);
  const unread = ANNOUNCEMENTS.length - readIds.length;

  return (
    <div className="grid-2">
      {/* 1. Panel with an "actions" slot and a list as children */}
      <Panel
        title={`Announcements (${unread})`}
        icon={<Bell size={16} aria-hidden="true" />}
        actions={
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setReadIds(ANNOUNCEMENTS.map((a) => a.id))}
            disabled={unread === 0}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        }
      >
        <ul className="jsx-announcements">
          {ANNOUNCEMENTS.map((a) => (
            <li key={a.id} className={readIds.includes(a.id) ? 'subtle' : ''}>
              {readIds.includes(a.id) ? '○' : '●'} {a.text}
            </li>
          ))}
        </ul>
      </Panel>

      {/* 2. The SAME Panel, filled with completely different children + a footer slot */}
      <Panel
        title="Assignment 3"
        icon={<CalendarDays size={16} aria-hidden="true" />}
        footer={
          <>
            <span className="small muted">Due Friday, 5:00 pm</span>
            <button type="button" className="btn btn-sm btn-primary" aria-expanded={showBrief}
              onClick={() => setShowBrief((v) => !v)}>
              {showBrief ? 'Hide brief' : 'Show brief'}
            </button>
          </>
        }
      >
        <p className="small m-0">Build a React front-end for your FastAPI + ML back-end.</p>
        <progress value={60} max={100} aria-label="Progress" className="jsx-panel-progress" />
        <span className="small muted">60% of milestones complete</span>
        {/* children can depend on the parent's state, like any other JSX */}
        {showBrief && (
          <p className="small m-0 card card-subtle">
            Tip: sketch your component tree on paper before you write any code.
          </p>
        )}
      </Panel>

      {/* 3. Panels can contain other Panels – composition all the way down */}
      <Panel title="Nested panels">
        <Panel title="Inner panel">
          <p className="small m-0">children can be anything: text, elements, or other components.</p>
        </Panel>
      </Panel>

      {/* 4. Children can even be a plain string */}
      <Panel title="Just text">Hello from props.children 👋</Panel>
    </div>
  );
}
