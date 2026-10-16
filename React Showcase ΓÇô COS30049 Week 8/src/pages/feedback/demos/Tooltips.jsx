/**
 * Tooltips – short hints that appear on hover AND on keyboard focus.
 *
 * - The tooltip text is always in the DOM (hidden with CSS) and linked to the
 *   trigger with aria-describedby, so screen readers read it as a description.
 * - <Tooltip> uses a "render prop": children is a FUNCTION that receives the
 *   props the trigger needs. That way any element can be the trigger.
 * - Esc hides an open tooltip (a WCAG requirement for content shown on hover).
 * - Collision detection: `placement` is only a wish. Just before showing, we
 *   measure the room around the trigger; if the bubble would be cut off we
 *   FLIP it to another side and SHIFT it along that edge (what libraries such
 *   as Floating UI do). Make the window narrow to watch it happen.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Bookmark, CircleHelp, Download, Share2 } from 'lucide-react';
import styles from './Tooltips.module.css';

const GAP = 8; // px between trigger and bubble – same as in the CSS

// Sides to try, in order. Left/right fall back to top/bottom when neither fits.
const FALLBACKS = {
  top: ['top', 'bottom'],
  bottom: ['bottom', 'top'],
  left: ['left', 'right', 'top', 'bottom'],
  right: ['right', 'left', 'top', 'bottom'],
};

// Plain function (no React): pick a side that fits inside `area`, then slide the bubble along it.
function fitInside(trigger, bubble, area, placement) {
  const t = trigger.getBoundingClientRect();
  const w = bubble.offsetWidth; // offsetWidth ignores CSS translate, so this is the real size
  const h = bubble.offsetHeight;
  const room = { top: t.top - area.top, bottom: area.bottom - t.bottom, left: t.left - area.left, right: area.right - t.right };
  const needs = { top: h + GAP, bottom: h + GAP, left: w + GAP, right: w + GAP };
  const side = FALLBACKS[placement].find((s) => room[s] >= needs[s]) ?? placement; // FLIP

  // SHIFT: the bubble is centred on the trigger; clamp it so both ends stay inside the area.
  const vertical = side === 'top' || side === 'bottom';
  const start = vertical ? t.left + t.width / 2 - w / 2 : t.top + t.height / 2 - h / 2;
  const min = vertical ? area.left : area.top;
  const max = vertical ? area.right - w : area.bottom - h;
  const shift = Math.max(min, Math.min(start, max)) - start;
  return { side, shift };
}

function Tooltip({ text, placement = 'top', children }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ side: placement, shift: 0 });
  const wrapperRef = useRef(null);
  const bubbleRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!visible) return undefined;
    const handleKeyDown = (event) => event.key === 'Escape' && setVisible(false);
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // Measure in the event handler (no effect needed): the hidden bubble is still laid out,
  // so its size is known. The area is the nearest [data-tooltip-boundary] (the demo card
  // clips anything outside it), otherwise the browser window.
  const show = () => {
    const boundary = wrapperRef.current.closest('[data-tooltip-boundary]');
    const area = boundary?.getBoundingClientRect() ?? { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
    setPosition(fitInside(wrapperRef.current, bubbleRef.current, area, placement));
    setVisible(true);
  };
  const hide = () => setVisible(false);

  return (
    <span ref={wrapperRef} className={styles.wrapper} onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {children({ 'aria-describedby': id })}
      <span
        ref={bubbleRef}
        role="tooltip"
        id={id}
        className={`${styles.tooltip} ${styles[position.side]}`}
        style={{ '--shift': `${position.shift}px` }} // a CSS custom property moves bubble + arrow
        data-visible={visible}
      >
        {text}
      </span>
    </span>
  );
}

const BUTTONS = [
  { label: 'Download slides', icon: Download, placement: 'top', tip: 'Download slides (PDF, 4 MB)' },
  { label: 'Share', icon: Share2, placement: 'right', tip: 'Copy a link to this lecture' },
  { label: 'Bookmark', icon: Bookmark, placement: 'bottom', tip: 'Save to your study list' },
  { label: 'Help', icon: CircleHelp, placement: 'left', tip: 'Keyboard shortcuts' },
];

export default function Tooltips() {
  return (
    <div className={styles.demo} data-tooltip-boundary>
      <div className="row" style={{ gap: 16 }}>
        {BUTTONS.map(({ label, icon: Icon, placement, tip }) => (
          <Tooltip key={label} text={tip} placement={placement}>
            {(triggerProps) => (
              <button type="button" className="btn" aria-label={label} {...triggerProps}>
                <Icon size={18} aria-hidden="true" /> <span className="small muted">{placement}</span>
              </button>
            )}
          </Tooltip>
        ))}
      </div>
      <p className="m-0">
        Your{' '}
        <Tooltip text="Weighted Average Mark – your average, weighted by credit points">
          {(triggerProps) => (
            <span className={styles.term} tabIndex={0} {...triggerProps}>
              WAM
            </span>
          )}
        </Tooltip>{' '}
        is updated when results are released.
      </p>
      <p className="m-0 small subtle center">
        The labels show the <em>requested</em> side. On a narrow screen a tooltip that would be cut off flips or slides.
      </p>
    </div>
  );
}
