/**
 * Carousel – an image slider with buttons, dots, auto-play and swipe.
 *
 * - `index` is the only essential state; the track is moved with a CSS transform.
 * - Auto-play is a setTimeout inside useEffect. It pauses while the pointer is
 *   over the carousel or focus is inside it, and is OFF for people who ask the
 *   operating system for reduced motion (prefers-reduced-motion).
 * - Swipe uses Pointer Events, which work for mouse, touch and pen alike.
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import styles from './Carousel.module.css';

const SLIDES = [
  { seed: 'campus-library', title: 'Library open 24/7 during exams', text: 'Quiet zones on levels 3 and 4.' },
  { seed: 'student-hackathon', title: 'Hackathon this Friday', text: 'Build something in 24 hours – pizza provided.' },
  { seed: 'lecture-theatre', title: 'Guest lecture: ML in production', text: 'Wednesday 5 pm, lecture theatre AR104.' },
  { seed: 'campus-garden', title: 'Wellbeing week', text: 'Free yoga, coffee and study-skills sessions.' },
];
const DELAY = 4000;
const SWIPE_THRESHOLD = 50; // px the pointer must travel to count as a swipe
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// A tiny custom hook: true when the OS "reduce motion" setting is on.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED_MOTION).matches);
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    const handleChange = () => setReduced(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);
  return reduced;
}

export default function Carousel() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [paused, setPaused] = useState(false); // hover or focus inside
  const [dragX, setDragX] = useState(0);
  const dragStart = useRef(null); // x position where the pointer went down
  const reducedMotion = usePrefersReducedMotion();

  const autoPlaying = playing && !paused && !reducedMotion;
  const goTo = (i) => setIndex((i + SLIDES.length) % SLIDES.length);

  // Restart the timer every time the slide changes, so each slide gets the full DELAY.
  useEffect(() => {
    if (!autoPlaying) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), DELAY);
    return () => clearTimeout(timer);
  }, [autoPlaying, index]);

  function handlePointerDown(event) {
    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId); // keep getting events outside the element
  }
  function handlePointerMove(event) {
    if (dragStart.current !== null) setDragX(event.clientX - dragStart.current);
  }
  function handlePointerUp() {
    if (dragX < -SWIPE_THRESHOLD) goTo(index + 1);
    if (dragX > SWIPE_THRESHOLD) goTo(index - 1);
    dragStart.current = null;
    setDragX(0);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowRight') goTo(index + 1);
    if (event.key === 'ArrowLeft') goTo(index - 1);
  }

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Campus news"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setPaused(false)}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.viewport}
        data-dragging={dragX !== 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* aria-live is "off" while auto-playing so screen readers aren't interrupted every 4 s */}
        <div className={styles.track} style={{ transform: `translateX(calc(${-index * 100}% + ${dragX}px))` }} aria-live={autoPlaying ? 'off' : 'polite'}>
          {SLIDES.map((slide, i) => (
            <figure key={slide.seed} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`} inert={i !== index}>
              <img src={`https://picsum.photos/seed/${slide.seed}/960/420`} alt={`Placeholder photo for “${slide.title}”`} draggable={false} width="960" height="420" />
              <figcaption className={styles.caption}>
                <strong>{slide.title}</strong>
                <span>{slide.text}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={() => goTo(index - 1)} aria-label="Previous slide">
        <ChevronLeft size={20} />
      </button>
      <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={() => goTo(index + 1)} aria-label="Next slide">
        <ChevronRight size={20} />
      </button>

      <div className={styles.controls}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlaying((p) => !p)} disabled={reducedMotion}>
          {playing && !reducedMotion ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          {reducedMotion ? 'Auto-play off (reduced motion)' : playing ? 'Pause' : 'Play'}
        </button>
        <div className={styles.dots}>
          {SLIDES.map((slide, i) => (
            <button key={slide.seed} type="button" className={styles.dot} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} onClick={() => goTo(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
