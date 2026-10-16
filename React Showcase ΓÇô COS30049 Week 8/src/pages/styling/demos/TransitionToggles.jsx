import { useState } from 'react';
import { Repeat } from 'lucide-react';
import Slider from './Slider.jsx';
import './TransitionToggles.css';

/**
 * TransitionToggles – a CSS `transition` animates between two states.
 * React's only job is to add or remove a class (here: "is-on"); the browser
 * does the animation. Duration and easing are passed in as CSS variables.
 *
 * Note: the elements stay MOUNTED. If you wrote {on && <Box />}, React would
 * remove the element instantly and there would be nothing left to animate.
 */
const EFFECTS = ['fade', 'slide', 'scale'];
const EASINGS = {
  ease: 'ease',
  linear: 'linear',
  'ease-in-out': 'ease-in-out',
  overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export default function TransitionToggles() {
  const [on, setOn] = useState(true);
  const [duration, setDuration] = useState(500);
  const [easing, setEasing] = useState('ease');

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-primary" aria-pressed={on} onClick={() => setOn(!on)}>
          <Repeat size={16} /> Toggle “is-on”
        </button>
        <div className="btn-group" role="group" aria-label="Easing">
          {Object.keys(EASINGS).map((name) => (
            <button
              key={name}
              type="button"
              className={`btn btn-sm ${easing === name ? 'active' : ''}`}
              aria-pressed={easing === name}
              onClick={() => setEasing(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <Slider label="transition-duration" value={duration} onChange={setDuration} min={100} max={2000} step={100} unit="ms" />

      <div className="styling-fx-grid" style={{ '--duration': `${duration}ms`, '--easing': EASINGS[easing] }}>
        {EFFECTS.map((effect) => (
          <figure key={effect} className="styling-fx-tile">
            <div className="styling-fx-stage">
              <div className={`styling-fx-box styling-fx-${effect} ${on ? 'is-on' : ''}`}>{effect}</div>
            </div>
            <figcaption className="mono small">.styling-fx-{effect}{on ? '.is-on' : ''}</figcaption>
          </figure>
        ))}

        {/* 3D flip: two faces back to back, the inner wrapper rotates 180° */}
        <figure className="styling-fx-tile">
          <div className="styling-fx-stage">
            <div className={`styling-flip ${on ? '' : 'is-flipped'}`}>
              <div className="styling-flip-inner">
                <div className="styling-flip-face">Which hook stores state?</div>
                <div className="styling-flip-face styling-flip-back">useState ✓</div>
              </div>
            </div>
          </div>
          <figcaption className="mono small">.styling-flip{on ? '' : '.is-flipped'}</figcaption>
        </figure>
      </div>
    </div>
  );
}
