/**
 * DocumentTitle – syncing React state with something OUTSIDE React.
 *
 * document.title is not part of your JSX, so React can't update it for you.
 * An effect with [unread] in the dependency array runs after every render in
 * which `unread` changed, and its cleanup puts the old title back.
 *
 * Look at your browser tab while you click the buttons.
 */
import { useEffect, useState } from 'react';
import { Bell, MailOpen } from 'lucide-react';

export default function DocumentTitle() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (unread === 0) return undefined; // nothing to show → leave the title alone
    const original = document.title;
    document.title = `(${unread}) ${original}`;
    // Cleanup runs BEFORE the next effect (and on unmount): restore the title.
    return () => {
      document.title = original;
    };
  }, [unread]); // ← only re-run when `unread` changes

  return (
    <div className="stack">
      <p className="m-0">
        Browser tab: <code>{unread > 0 ? `(${unread}) ` : ''}Hooks &amp; Lifecycle · …</code>
      </p>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={() => setUnread((n) => n + 1)}>
          <Bell size={16} /> New message
        </button>
        <button type="button" className="btn" onClick={() => setUnread(0)} disabled={unread === 0}>
          <MailOpen size={16} /> Mark all read
        </button>
      </div>
      <p className="small muted m-0">
        {unread === 0 ? 'No unread messages.' : `${unread} unread message${unread === 1 ? '' : 's'}.`}
      </p>
    </div>
  );
}
