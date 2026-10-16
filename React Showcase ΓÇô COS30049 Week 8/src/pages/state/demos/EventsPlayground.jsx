/**
 * EventsPlayground – the most common React events in one place.
 *
 * - Event props are camelCase (onClick, onKeyDown) and take a FUNCTION.
 * - React passes an event object to your handler: event.key, event.clientX,
 *   event.currentTarget, event.preventDefault()… (a cross-browser "SyntheticEvent").
 * - Handlers usually do one thing: update state. The log below is state too.
 */
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

const MAX_ENTRIES = 12;
let nextId = 1;

const LAB_RULES = [
  'Attend your weekly lab.',
  'Commit to Git early and often.',
  'Write meaningful commit messages.',
  'Test the API with the FastAPI docs page (/docs).',
  'Ask questions on the discussion board.',
  'Start the assignment before the week it is due.',
  'Keep components small.',
  'You made it to the end! 🎉',
];

export default function EventsPlayground() {
  const [log, setLog] = useState([]);
  const [mouse, setMouse] = useState({ x: 0, y: 0, inside: false });
  const [scrollPercent, setScrollPercent] = useState(0);

  // Add an entry to the top of the log and keep only the newest 12.
  function addLog(type, detail = '') {
    const entry = { id: nextId++, type, detail, time: new Date().toLocaleTimeString('en-AU', { hour12: false }) };
    setLog((current) => [entry, ...current].slice(0, MAX_ENTRIES));
  }

  function handleMouseMove(event) {
    // currentTarget = the element the handler is attached to (the box)
    const rect = event.currentTarget.getBoundingClientRect();
    setMouse({ x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top), inside: true });
  }

  function handleKeyDown(event) {
    const modifiers = ['ctrlKey', 'shiftKey', 'altKey', 'metaKey']
      .filter((name) => event[name])
      .map((name) => name.replace('Key', ''));
    addLog('onKeyDown', `key="${event.key}" code="${event.code}"${modifiers.length ? ` + ${modifiers.join(' + ')}` : ''}`);
  }

  function handleScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const maxScroll = scrollHeight - clientHeight;
    const percent = maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 100;
    // Only log once when we ARRIVE at the bottom (scroll events fire many times per second).
    if (percent === 100 && scrollPercent < 100) addLog('onScroll', 'reached the bottom');
    setScrollPercent(percent);
  }

  return (
    <div className="grid-2">
      <div className="stack">
        {/* 1. Mouse buttons */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={(e) => addLog('onClick', `button ${e.button}, detail=${e.detail}`)}
          onDoubleClick={() => addLog('onDoubleClick')}
          onContextMenu={(e) => {
            e.preventDefault(); // hide the browser's right-click menu
            addLog('onContextMenu', 'right-click (menu blocked)');
          }}
        >
          Click, double-click or right-click me
        </button>

        {/* 2. Mouse position */}
        <div
          className="state-mouse-area"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => addLog('onMouseEnter')}
          onMouseLeave={() => {
            setMouse((m) => ({ ...m, inside: false }));
            addLog('onMouseLeave');
          }}
        >
          {mouse.inside && <span className="state-mouse-dot" style={{ left: mouse.x, top: mouse.y }} />}
          <span className="small mono">
            {mouse.inside ? `x: ${mouse.x}px  y: ${mouse.y}px` : 'Move the mouse in here'}
          </span>
        </div>

        {/* 3. Keyboard + focus */}
        <input
          className="input"
          placeholder="Focus me and press keys (try Shift + A, arrows…)"
          aria-label="Keyboard test input"
          onKeyDown={handleKeyDown}
          onFocus={() => addLog('onFocus', 'input gained focus')}
          onBlur={() => addLog('onBlur', 'input lost focus')}
          onPaste={(e) => addLog('onPaste', `"${e.clipboardData.getData('text').slice(0, 30)}"`)}
        />

        {/* 4. Clipboard */}
        <p className="small m-0 state-copy-text" onCopy={() => addLog('onCopy', `"${window.getSelection().toString().slice(0, 30)}"`)}>
          Select and copy (Ctrl/⌘ + C) some of this sentence, then paste it into the input above.
        </p>

        {/* 5. Scrolling */}
        <div className="stack-sm">
          <div className="state-scroll-progress" aria-hidden="true">
            <div style={{ width: `${scrollPercent}%` }} />
          </div>
          <div className="state-scroll-box" onScroll={handleScroll} tabIndex={0} role="region" aria-label="Scrollable unit rules">
            <p className="small m-0">Scroll me: {scrollPercent}%</p>
            {LAB_RULES.map((rule) => <p key={rule} className="small">{rule}</p>)}
          </div>
        </div>
      </div>

      <div className="stack-sm">
        <div className="row-between">
          <span className="label">Event log (newest first)</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLog([])} disabled={log.length === 0}>
            <Trash2 size={14} /> Clear
          </button>
        </div>
        <ol className="state-log">
          {log.length === 0 && <li className="subtle">Interact with the elements on the left…</li>}
          {log.map((entry) => (
            <li key={entry.id}>
              <time className="subtle">{entry.time}</time> <span className="badge badge-code">{entry.type}</span>{' '}
              {entry.detail}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
