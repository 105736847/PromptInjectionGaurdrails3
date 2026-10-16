/**
 * BadgesAvatars – small status indicators.
 *
 * - Notification badge: a number on an icon button, capped at "99+", hidden at 0.
 *   The button's aria-label includes the count, because the badge is decorative.
 * - Avatar: shows a photo, and falls back to initials when there is no photo OR
 *   the image fails to load (onError → state).
 * - Avatar group: show the first few, then "+3" for the rest.
 * - Removable chips: filter() the array to remove one.
 */
import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import styles from './BadgesAvatars.module.css';

const TEAM = [
  { name: 'Aisha Khan', photo: 'https://picsum.photos/seed/aisha-k/80/80', status: 'online' },
  { name: 'Ben Evans', photo: 'https://picsum.photos/seed/ben-e/80/80', status: 'away' },
  { name: 'Chloe Kim', photo: null, status: 'online' }, // no photo → initials
  { name: 'Daniel Murphy', photo: 'https://picsum.photos/id/99999/80/80', status: 'offline' }, // broken URL → initials
  { name: 'Ella Nguyen', photo: 'https://picsum.photos/seed/ella-n/80/80', status: 'online' },
  { name: 'Farid Rahman', photo: null, status: 'away' },
  { name: 'Grace Wilson', photo: 'https://picsum.photos/seed/grace-w/80/80', status: 'offline' },
];
const SKILLS = ['React', 'FastAPI', 'Python', 'scikit-learn', 'Figma', 'Git'];

const initials = (name) => name.split(' ').map((part) => part[0]).join('');

function Avatar({ name, photo, status, size = 44 }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles.avatarWrap} style={{ width: size, height: size }}>
      <span className="avatar" style={{ width: size, height: size }}>
        {photo && !failed ? (
          <img src={photo} alt={name} width={size} height={size} onError={() => setFailed(true)} />
        ) : (
          <span role="img" aria-label={name}>{initials(name)}</span>
        )}
      </span>
      {status && <span className={styles.status} data-status={status} title={status} aria-label={status} role="img" />}
    </span>
  );
}

export default function BadgesAvatars() {
  const [unread, setUnread] = useState(7);
  const [skills, setSkills] = useState(SKILLS);
  const shown = TEAM.slice(0, 4);
  const hidden = TEAM.length - shown.length;

  return (
    <div className={styles.grid}>
      <section className="stack">
        <h4 className="m-0">Notification badge</h4>
        <div className="row">
          <button type="button" className={`btn-icon ${styles.bell}`} aria-label={`Notifications, ${unread} unread`}>
            <Bell size={22} />
            {unread > 0 && <span className={styles.count} aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setUnread((n) => n + 1)}>+1</button>
          <button type="button" className="btn btn-sm" onClick={() => setUnread((n) => n + 50)}>+50</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setUnread(0)}>Mark all read</button>
        </div>
      </section>

      <section className="stack">
        <h4 className="m-0">Avatars with status</h4>
        <ul className={styles.people}>
          {TEAM.slice(0, 4).map((person) => (
            <li key={person.name} className="row" style={{ gap: 8 }}>
              <Avatar {...person} />
              <span className="small">{person.name.split(' ')[0]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack">
        <h4 className="m-0">Avatar group</h4>
        <div className={styles.group} role="img" aria-label={`Team 12: ${TEAM.map((p) => p.name).join(', ')}`}>
          {shown.map((person) => (
            <Avatar key={person.name} name={person.name} photo={person.photo} size={40} />
          ))}
          <span className={`avatar ${styles.more}`}>+{hidden}</span>
        </div>
      </section>

      <section className="stack">
        <h4 className="m-0">Removable chips</h4>
        <ul className={styles.chips} aria-label="Team skills">
          {skills.map((skill) => (
            <li key={skill} className={styles.chip}>
              {skill}
              <button type="button" onClick={() => setSkills((current) => current.filter((s) => s !== skill))} aria-label={`Remove ${skill}`}>
                <X size={12} />
              </button>
            </li>
          ))}
          {skills.length < SKILLS.length && (
            <li>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSkills(SKILLS)}>Reset</button>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
