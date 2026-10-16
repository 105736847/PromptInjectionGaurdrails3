import { useState } from 'react';
import { Expand } from 'lucide-react';
import Lightbox from './Lightbox.jsx';
import styles from './Gallery.module.css';

/**
 * Image gallery grid + lightbox.
 *
 * The gallery only stores WHICH photo is open (an index, or null for
 * "closed"). The <Lightbox> is rendered conditionally and receives the
 * index and two callbacks as props – the parent stays in charge of state.
 */
// picsum.photos gives a random (but fixed per seed) photo, so we can't describe what is IN it.
// With real photos, alt text should describe the picture, e.g. "Students studying in the library".
const ENTRIES = ['Mia Tran', 'Arjun Mehta', 'Sofia Rossi', 'Liam Nguyen', 'Chloe Wang', 'Noah Kim', 'Ava Patel', 'Ethan Brown'];
const PHOTOS = ENTRIES.map((name, i) => ({
  seed: `photo-comp-${i + 1}`,
  caption: `Photo competition – entry by ${name}`,
  alt: `Competition entry ${i + 1} by ${name} (random placeholder photo)`,
  thumb: `https://picsum.photos/seed/photo-comp-${i + 1}/400/300`, // small file for the grid
  src: `https://picsum.photos/seed/photo-comp-${i + 1}/1200/800`, // large file for the lightbox
}));

export default function Gallery() {
  const [openIndex, setOpenIndex] = useState(null); // null = lightbox closed

  return (
    <>
      <ul className={styles.grid}>
        {PHOTOS.map((photo, index) => (
          <li key={photo.seed}>
            <button type="button" className={styles.thumb} onClick={() => setOpenIndex(index)}
              aria-label={`Open photo ${index + 1}: ${photo.caption}`}>
              <img src={photo.thumb} alt="" loading="lazy" width={400} height={300} />
              <span className={styles.thumbIcon} aria-hidden="true"><Expand size={16} /></span>
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox
          images={PHOTOS}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}
