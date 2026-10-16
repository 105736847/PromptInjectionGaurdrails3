import { useId, useState } from 'react';
import { Bell, ArrowDown, LoaderCircle, Heart, Pause, Play } from 'lucide-react';
import './KeyframeAnimations.css';

/**
 * KeyframeAnimations – @keyframes describe a multi-step animation that can
 * loop forever (pulse, bounce, spin) or play once (shake).
 *
 * To REPLAY a one-off animation, the class must be removed and added again.
 * onAnimationEnd tells React when the animation has finished, so we can
 * remove the class and be ready for the next time.
 */
const LOOPS = [
  { name: 'pulse', Icon: Bell, label: '3 new messages' },
  { name: 'bounce', Icon: ArrowDown, label: 'Scroll down' },
  { name: 'spin', Icon: LoaderCircle, label: 'Loading…' },
  { name: 'beat', Icon: Heart, label: 'Liked' },
];

export default function KeyframeAnimations() {
  const [paused, setPaused] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [shake, setShake] = useState(false);
  const [result, setResult] = useState(null); // null | 'invalid' | 'valid'
  const inputId = useId();

  function handleSubmit(event) {
    event.preventDefault();
    if (/^\d{9}$/.test(studentId)) {
      setResult('valid');
    } else {
      setResult('invalid');
      setShake(true); // adds the class → the shake animation starts
    }
  }

  return (
    <div className="grid-2">
      <div className="stack">
        <div className={`styling-loops ${paused ? 'is-paused' : ''}`}>
          {LOOPS.map(({ name, Icon, label }) => (
            <div key={name} className="styling-loop">
              <span className={`styling-anim-${name}`}>
                <Icon size={26} aria-hidden="true" />
              </span>
              <span className="small mono">{name}</span>
              <span className="visually-hidden">{label}</span>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-sm" onClick={() => setPaused(!paused)}>
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? 'Play' : 'Pause'} (animation-play-state)
        </button>
      </div>

      <form className="stack" onSubmit={handleSubmit} noValidate>
        <div
          className={`field ${shake ? 'styling-anim-shake' : ''}`}
          // Fired when the shake finishes → remove the class so it can play again.
          onAnimationEnd={() => setShake(false)}
        >
          <label className="label" htmlFor={inputId}>Student ID</label>
          <input
            id={inputId}
            className="input"
            inputMode="numeric"
            placeholder="9 digits, e.g. 104123456"
            value={studentId}
            onChange={(event) => {
              setStudentId(event.target.value);
              setResult(null);
            }}
            aria-invalid={result === 'invalid'}
            aria-describedby={`${inputId}-msg`}
          />
          <p id={`${inputId}-msg`} className={result === 'invalid' ? 'error-text' : 'hint'} aria-live="polite">
            {result === 'invalid' && 'A student ID has exactly 9 digits.'}
            {result === 'valid' && '✓ Looks good!'}
            {result === null && 'Submit something wrong to see it shake.'}
          </p>
        </div>
        <div>
          <button type="submit" className="btn btn-primary">Check ID</button>
        </div>
      </form>
    </div>
  );
}
