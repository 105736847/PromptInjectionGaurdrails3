/**
 * Callout – a highlighted teaching note.
 *
 *   <Callout type="tip" title="Remember">Keys must be unique among siblings.</Callout>
 *
 *   type: 'note' (default) | 'tip' | 'warning' | 'exercise'
 *   Use type="exercise" for "Try it yourself" tasks for students.
 */
import { Info, Lightbulb, TriangleAlert, PencilLine } from 'lucide-react';

const ICONS = {
  note: Info,
  tip: Lightbulb,
  warning: TriangleAlert,
  exercise: PencilLine,
};

const DEFAULT_TITLES = {
  note: 'Note',
  tip: 'Tip',
  warning: 'Watch out',
  exercise: 'Try it yourself',
};

export default function Callout({ type = 'note', title, children }) {
  const Icon = ICONS[type] ?? Info;
  return (
    <aside className={`callout callout-${type}`}>
      <Icon size={20} aria-hidden="true" />
      <div>
        <strong className="callout-title">{title ?? DEFAULT_TITLES[type]}</strong>
        {children}
      </div>
    </aside>
  );
}
