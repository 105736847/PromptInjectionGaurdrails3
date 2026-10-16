/**
 * DataStates – the four states every data-driven view needs:
 *   loading (skeleton) → success (content) | empty | error
 *
 * - `status` is ONE state variable with a few possible values, instead of
 *   several booleans (isLoading, hasError…) that could contradict each other.
 * - fakeFetch() returns a Promise, just like fetch() would. The `ignore` flag
 *   (the pattern from react.dev) stops an old, slow response from overwriting
 *   a newer one if you click Reload quickly.
 * - EmptyState and ErrorState are small reusable components.
 */
import { useEffect, useState } from 'react';
import { CloudOff, Inbox, Megaphone, RefreshCw } from 'lucide-react';
import styles from './DataStates.module.css';

const ANNOUNCEMENTS = [
  { id: 1, title: 'Assignment 3 brief released', author: 'Dr Maya Chen', text: 'The full-stack brief and marking rubric are now on the unit site.' },
  { id: 2, title: 'Lab 8 moved to room EN310', author: 'Unit convenor', text: 'Only for this week – the projector in BA403 is being replaced.' },
  { id: 3, title: 'Guest lecture recording', author: 'Dr Sam Okafor', text: 'The recording of “ML in production” is available in the Media tab.' },
];

function fakeFetch(outcome) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (outcome === 'error') reject(new Error('503 – the server is temporarily unavailable.'));
      else resolve(outcome === 'empty' ? [] : ANNOUNCEMENTS);
    }, 1500);
  });
}

function EmptyState({ icon: Icon = Inbox, title, message, action, tone = 'neutral' }) {
  return (
    <div className={styles.state} data-tone={tone}>
      <span className={styles.stateIcon}><Icon size={28} aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p className="small muted m-0">{message}</p>
      {action}
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <EmptyState
      icon={CloudOff}
      tone="danger"
      title="Couldn’t load announcements"
      message={error.message}
      action={<button type="button" className="btn btn-sm" onClick={onRetry}><RefreshCw size={14} aria-hidden="true" /> Try again</button>}
    />
  );
}

function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <span className={`${styles.skeleton} ${styles.line}`} style={{ width: '60%' }} />
      <span className={`${styles.skeleton} ${styles.line}`} style={{ width: '30%', height: 10 }} />
      <span className={`${styles.skeleton} ${styles.line}`} />
      <span className={`${styles.skeleton} ${styles.line}`} style={{ width: '85%' }} />
    </div>
  );
}

export default function DataStates() {
  const [outcome, setOutcome] = useState('success'); // what the NEXT fake request returns
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(0); // bump to re-run the effect

  useEffect(() => {
    let ignore = false;
    fakeFetch(outcome)
      .then((data) => {
        if (ignore) return;
        setItems(data);
        setStatus('success');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err);
        setStatus('error');
      });
    return () => {
      ignore = true; // this request is outdated now
    };
  }, [outcome, requestId]);

  function reload(nextOutcome = outcome) {
    setStatus('loading'); // set in the event handler, not in the effect
    setOutcome(nextOutcome);
    setRequestId((id) => id + 1);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <div className="btn-group" role="group" aria-label="Next response">
          {['success', 'empty', 'error'].map((option) => (
            <button key={option} type="button" className={`btn btn-sm ${outcome === option ? 'active' : ''}`} aria-pressed={outcome === option} onClick={() => reload(option)}>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => reload()} disabled={status === 'loading'}>
          <RefreshCw size={14} aria-hidden="true" /> Reload
        </button>
      </div>

      <section aria-label="Announcements" aria-busy={status === 'loading'} className={styles.feed}>
        {status === 'loading' && (
          <>
            <span className="visually-hidden" role="status">Loading announcements…</span>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
        {status === 'error' && <ErrorState error={error} onRetry={() => reload()} />}
        {status === 'success' && items.length === 0 && (
          <EmptyState
            title="No announcements yet"
            message="When your lecturer posts something, it will show up here."
            action={<button type="button" className="btn btn-sm" onClick={() => reload('success')}>Check again</button>}
          />
        )}
        {status === 'success' &&
          items.map((item) => (
            <article key={item.id} className={styles.card}>
              <h4 className="m-0 row" style={{ gap: 8 }}><Megaphone size={16} aria-hidden="true" /> {item.title}</h4>
              <span className="small subtle">{item.author}</span>
              <p className="small m-0">{item.text}</p>
            </article>
          ))}
      </section>
    </div>
  );
}
