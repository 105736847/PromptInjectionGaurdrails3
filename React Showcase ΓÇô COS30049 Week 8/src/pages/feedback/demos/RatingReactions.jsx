/**
 * RatingReactions – a star rating input, a read-only half-star display and a
 * reactions bar.
 *
 * - The interactive rating is a group of REAL radio buttons (visually hidden)
 *   with star icons as their labels. The browser gives us ← → keyboard support.
 * - `hover` is separate state: the stars preview the value under the pointer,
 *   and fall back to the saved `value` when the pointer leaves.
 * - Half stars: draw an outline star, then a filled star on top that is clipped
 *   to a percentage width.
 * - Reactions: each button toggles `mine` and adjusts its count (aria-pressed).
 */
import { useId, useState } from 'react';
import { Star } from 'lucide-react';
import styles from './RatingReactions.module.css';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function StarRating({ value, onChange, label }) {
  const [hover, setHover] = useState(0);
  const name = useId();
  const shown = hover || value; // preview wins while hovering

  return (
    <fieldset className={styles.rating} onPointerLeave={() => setHover(0)}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className={styles.star} data-filled={star <= shown} onPointerEnter={() => setHover(star)}>
            <input type="radio" name={name} value={star} checked={value === star} onChange={() => onChange(star)} className="visually-hidden" />
            <Star size={30} aria-hidden="true" />
            <span className="visually-hidden">{star} star{star > 1 ? 's' : ''}</span>
          </label>
        ))}
        <span className={styles.caption} aria-live="polite">{LABELS[shown] || 'Not rated yet'}</span>
      </div>
    </fieldset>
  );
}

function StarDisplay({ value, max = 5 }) {
  return (
    <span className={styles.display} role="img" aria-label={`Rated ${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(Math.max(value - i, 0), 1); // 0, 0.5 or 1 for this star
        return (
          <span key={i} className={styles.displayStar}>
            <Star size={18} className={styles.outline} />
            <span className={styles.fillClip} style={{ width: `${fill * 100}%` }}>
              <Star size={18} className={styles.filled} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

const UNITS = [
  { code: 'COS30049', rating: 4.5, reviews: 128 },
  { code: 'COS30043', rating: 4, reviews: 86 },
  { code: 'COS20007', rating: 3.5, reviews: 211 },
];

export default function RatingReactions() {
  const [rating, setRating] = useState(0);
  const [reactions, setReactions] = useState([
    { emoji: '👍', label: 'Thumbs up', count: 12, mine: false },
    { emoji: '❤️', label: 'Love', count: 5, mine: true },
    { emoji: '🎉', label: 'Celebrate', count: 3, mine: false },
    { emoji: '😮', label: 'Surprised', count: 1, mine: false },
  ]);

  function toggleReaction(emoji) {
    setReactions((current) =>
      current.map((r) => (r.emoji === emoji ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r)),
    );
  }

  return (
    <div className={styles.grid}>
      <div className="stack">
        <StarRating label="How would you rate this week’s lab?" value={rating} onChange={setRating} />
        <ul className={styles.unitList}>
          {UNITS.map((unit) => (
            <li key={unit.code}>
              <span className="mono small">{unit.code}</span>
              <StarDisplay value={unit.rating} />
              <span className="small muted">{unit.rating} ({unit.reviews})</span>
            </li>
          ))}
        </ul>
      </div>

      <article className={`card ${styles.post}`}>
        <strong>📢 Assignment 2 marks are out!</strong>
        <p className="small muted m-0">Feedback is on the unit site. Great work, everyone.</p>
        <div className={styles.reactions} role="group" aria-label="Reactions">
          {reactions.map((r) => (
            <button key={r.emoji} type="button" className={styles.reaction} aria-pressed={r.mine} aria-label={`${r.label}: ${r.count}`} onClick={() => toggleReaction(r.emoji)}>
              <span aria-hidden="true">{r.emoji}</span> {r.count}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
