import { useState } from 'react';
import { ImageOff, RefreshCw } from 'lucide-react';
import styles from './ImageStates.module.css';

/**
 * Image loading states with onLoad and onError.
 *
 * <SmartImage> shows a shimmering skeleton until the browser fires `load`,
 * and a friendly placeholder if it fires `error` (broken URL, offline…).
 * Like every network request, an image has three states:
 * loading → loaded, or loading → error.
 */
function SmartImage({ src, alt }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'

  return (
    <div className={styles.frame}>
      {status === 'loading' && <div className={styles.skeleton} aria-hidden="true" />}
      {status === 'error' ? (
        <div className={styles.fallback} role="img" aria-label={`${alt} (image failed to load)`}>
          <ImageOff size={28} aria-hidden="true" />
          <span className="small">Image unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${styles.img} ${status === 'loaded' ? styles.visible : ''}`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      <span className={`badge ${styles.status}`}>{status}</span>
    </div>
  );
}

const IMAGES = [
  { seed: 'states-a', alt: 'Placeholder photo A' },
  { seed: 'states-b', alt: 'Placeholder photo B' },
  { seed: 'states-c', alt: 'Placeholder photo C' },
  { seed: null, alt: 'Placeholder photo D' }, // null → a broken URL that triggers onError
];

export default function ImageStates() {
  const [version, setVersion] = useState(1);

  return (
    <div className="stack">
      <div className="row-between">
        <span className="small muted">The last URL is broken on purpose.</span>
        {/* Changing `key` remounts every SmartImage → state resets to "loading" */}
        <button type="button" className="btn btn-sm" onClick={() => setVersion((v) => v + 1)}>
          <RefreshCw size={15} aria-hidden="true" /> Reload images
        </button>
      </div>
      <div className={styles.grid}>
        {IMAGES.map(({ seed, alt }) => (
          <SmartImage
            key={`${seed}-${version}`}
            // A new seed per version forces a real download (no cache) so you can see the skeleton
            src={seed ? `https://picsum.photos/seed/${seed}-${version}/400/300` : `/missing/photo-${version}.jpg`}
            alt={alt}
          />
        ))}
      </div>
    </div>
  );
}
