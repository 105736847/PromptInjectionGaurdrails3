import { useState } from 'react';

/**
 * Responsive images: let the BROWSER pick the best file.
 *
 * - alt: describes the image for screen readers (alt="" for decorative images).
 * - width + height: reserve space before the image loads → no layout jump.
 * - loading="lazy": only download when the image is about to scroll into view.
 * - srcSet + sizes: offer several widths; the browser chooses based on the
 *   screen size and pixel density. `currentSrc` tells us which one it chose.
 * - <picture> + <source media>: "art direction" – a different CROP on small
 *   screens; <source type> offers a modern format (WebP) with a fallback.
 */
const photo = (w, h, ext = '') => `https://picsum.photos/seed/cos30049-campus/${w}/${h}${ext}`;

export default function ResponsiveImages() {
  const [chosen, setChosen] = useState({ srcset: '', picture: '' });

  // onLoad gives us the <img> element – currentSrc is the file actually downloaded.
  const remember = (key) => (event) => {
    const src = event.currentTarget.currentSrc;
    setChosen((prev) => ({ ...prev, [key]: src }));
  };

  return (
    <div className="grid-2">
      <figure className="m-0 stack-sm">
        <img
          src={photo(800, 500)}
          srcSet={`${photo(400, 250)} 400w, ${photo(800, 500)} 800w, ${photo(1200, 750)} 1200w`}
          sizes="(max-width: 640px) 100vw, 50vw"
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          // Describe what is IN the image. Ours is a random placeholder, so we say exactly that.
          alt="Random landscape placeholder photo from picsum.photos"
          onLoad={remember('srcset')}
          style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius)' }}
        />
        <figcaption className="small muted">
          <strong>srcSet + sizes.</strong> 3 widths offered (400w / 800w / 1200w).
          <br />
          Browser chose: <code className="small">{chosen.srcset.split('/').slice(-2).join('/') || '…'}</code>
        </figcaption>
      </figure>

      <figure className="m-0 stack-sm">
        <picture>
          {/* Narrow screens get a square crop */}
          <source media="(max-width: 640px)" srcSet={photo(600, 600, '.webp')} type="image/webp" />
          {/* Everyone else: a wide banner, WebP if supported… */}
          <source srcSet={photo(1000, 500, '.webp')} type="image/webp" />
          {/* …and the <img> is the required fallback (and carries alt, size, events) */}
          <img
            src={photo(1000, 500)}
            width={1000}
            height={500}
            loading="lazy"
            alt="The same placeholder photo, cropped for the current screen size"
            onLoad={remember('picture')}
            style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius)' }}
          />
        </picture>
        <figcaption className="small muted">
          <strong>&lt;picture&gt; art direction.</strong> Square WebP below 640px, wide WebP above, JPEG fallback.
          <br />
          Browser chose: <code className="small">{chosen.picture.split('/').slice(-2).join('/') || '…'}</code>
        </figcaption>
      </figure>

      <p className="hint m-0" style={{ gridColumn: '1 / -1' }}>
        Resize the window (or use DevTools device mode) and reload to see a different file being chosen.
      </p>
    </div>
  );
}
