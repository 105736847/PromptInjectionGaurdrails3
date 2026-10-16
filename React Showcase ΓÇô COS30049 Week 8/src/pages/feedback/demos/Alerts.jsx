/**
 * Alerts – inline messages in four variants, plus a sticky announcement banner.
 *
 * - The global classes `alert alert-info|success|warning|danger` do the styling.
 * - Dismissing is just state: we keep a list of dismissed ids and filter them out.
 * - role="alert" makes screen readers interrupt and read the message at once,
 *   so use it only for urgent messages. Calmer ones can use role="status" or none.
 */
import { useState } from 'react';
import { CircleAlert, CircleCheck, Info, Megaphone, RotateCcw, TriangleAlert, X } from 'lucide-react';
import styles from './Alerts.module.css';

const ALERTS = [
  { id: 'info', variant: 'info', icon: Info, title: 'Timetable released', text: 'Semester 2 class times are now available.' },
  { id: 'success', variant: 'success', icon: CircleCheck, title: 'Enrolment confirmed', text: 'You are enrolled in 4 units (50 credit points).' },
  {
    id: 'warning',
    variant: 'warning',
    icon: TriangleAlert,
    title: 'Census date is Friday',
    text: 'Withdraw by 31 August to avoid fees for a unit.',
    actions: ['Review my units', 'Remind me later'],
  },
  { id: 'danger', variant: 'danger', icon: CircleAlert, title: 'Payment overdue', text: 'Your student fees are 7 days overdue.', urgent: true },
];

export default function Alerts() {
  const [dismissed, setDismissed] = useState([]);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [lastAction, setLastAction] = useState(null);

  const visible = ALERTS.filter((alert) => !dismissed.includes(alert.id));

  return (
    <div className="stack-lg">
      <div className="stack">
        {visible.map(({ id, variant, icon: Icon, title, text, actions, urgent }) => (
          <div key={id} className={`alert alert-${variant} ${styles.alert}`} role={urgent ? 'alert' : undefined}>
            <Icon size={20} aria-hidden="true" />
            <div className={styles.body}>
              <strong>{title}</strong>
              <span className={styles.text}>{text}</span>
              {actions && (
                <div className="row mt-1">
                  {actions.map((action, i) => (
                    <button key={action} type="button" className={`btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLastAction(action)}>
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className={`btn-icon ${styles.close}`} onClick={() => setDismissed((current) => [...current, id])} aria-label={`Dismiss: ${title}`}>
              <X size={16} />
            </button>
          </div>
        ))}
        <div className="row">
          {dismissed.length > 0 && (
            <button type="button" className="btn btn-sm" onClick={() => setDismissed([])}>
              <RotateCcw size={14} aria-hidden="true" /> Show {dismissed.length} dismissed alert{dismissed.length > 1 ? 's' : ''}
            </button>
          )}
          {lastAction && <span className="small muted">You clicked “{lastAction}”.</span>}
        </div>
      </div>

      {/* A mini page that scrolls, to show a sticky banner */}
      <div className={styles.page} tabIndex={0} role="region" aria-label="Scrollable example page">
        {bannerOpen && (
          <div className={styles.banner} role="region" aria-label="Announcement">
            <Megaphone size={18} aria-hidden="true" />
            <span>
              <strong>Library hours extended</strong> during exams – open until midnight.{' '}
              <a href="#library-hours" onClick={(e) => e.preventDefault()}>See details</a>
            </span>
            <button type="button" className="btn-icon" onClick={() => setBannerOpen(false)} aria-label="Dismiss announcement">
              <X size={16} />
            </button>
          </div>
        )}
        <div className={styles.pageContent}>
          <h4>Scroll inside this box ↓</h4>
          {Array.from({ length: 6 }, (_, i) => (
            <p key={i} className="small muted">
              Paragraph {i + 1}. The announcement banner uses <code>position: sticky; top: 0</code>, so it stays at the top of
              this scrolling area while the content moves underneath it.
            </p>
          ))}
          {!bannerOpen && (
            <button type="button" className="btn btn-sm" onClick={() => setBannerOpen(true)}>Bring the banner back</button>
          )}
        </div>
      </div>
    </div>
  );
}
