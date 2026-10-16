/**
 * TemperatureConverter – LIFTING STATE UP.
 *
 * Two sibling inputs must always agree. If each kept its own state they would
 * drift apart, so we move ("lift") the state up to their closest common parent.
 *
 *   Parent: owns { temperature, scale } and does the conversion
 *     ├─ <TemperatureInput scale="c" value={celsius}    onChange={…} />
 *     └─ <TemperatureInput scale="f" value={fahrenheit} onChange={…} />
 *
 * The children are "controlled": they display props and report changes upward.
 */
import { useId, useState } from 'react';

const SCALE_NAMES = { c: 'Celsius', f: 'Fahrenheit' };

const toCelsius = (f) => ((f - 32) * 5) / 9;
const toFahrenheit = (c) => (c * 9) / 5 + 32;

// Convert a string like "100" using a conversion function; keep "" for invalid input.
function tryConvert(value, convert) {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) return '';
  return String(Math.round(convert(number) * 100) / 100);
}

// CHILD – has NO state of its own. It shows `value` and calls `onChange` with the new text.
function TemperatureInput({ scale, value, onChange }) {
  const id = useId();
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{SCALE_NAMES[scale]} (°{scale.toUpperCase()})</label>
      <input id={id} className="input" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Verdict({ celsius }) {
  const c = Number.parseFloat(celsius);
  if (Number.isNaN(c)) return <p className="muted m-0">Enter a temperature.</p>;
  if (c >= 100) return <p className="alert alert-danger m-0">♨️ Water would boil.</p>;
  if (c <= 0) return <p className="alert alert-info m-0">🧊 Water would freeze.</p>;
  if (c >= 30) return <p className="alert alert-warning m-0">☀️ A hot Melbourne day – stay hydrated.</p>;
  return <p className="alert alert-success m-0">💧 Water stays liquid.</p>;
}

// PARENT – the single source of truth.
export default function TemperatureConverter() {
  const [temperature, setTemperature] = useState('22');
  const [scale, setScale] = useState('c'); // which input the user typed in last

  // Derive BOTH values from the one piece of state.
  const celsius = scale === 'f' ? tryConvert(temperature, toCelsius) : temperature;
  const fahrenheit = scale === 'c' ? tryConvert(temperature, toFahrenheit) : temperature;

  return (
    <div className="grid-2">
      <div className="stack">
        <TemperatureInput scale="c" value={celsius} onChange={(value) => { setTemperature(value); setScale('c'); }} />
        <TemperatureInput scale="f" value={fahrenheit} onChange={(value) => { setTemperature(value); setScale('f'); }} />
        <Verdict celsius={celsius} />
      </div>

      {/* A live diagram of the data flow */}
      <figure className="state-flow m-0" aria-label="Data flow diagram">
        <div className="state-flow-node state-flow-parent">
          <strong>TemperatureConverter</strong>
          <code>state = {`{ temperature: "${temperature}", scale: "${scale}" }`}</code>
        </div>
        <div className="state-flow-arrows small muted" aria-hidden="true">
          <span>↓ props: value</span>
          <span>↑ onChange(text)</span>
        </div>
        <div className="state-flow-children">
          <div className={`state-flow-node ${scale === 'c' ? 'is-active' : ''}`}>
            <strong>TemperatureInput c</strong>
            <code>value="{celsius}"</code>
          </div>
          <div className={`state-flow-node ${scale === 'f' ? 'is-active' : ''}`}>
            <strong>TemperatureInput f</strong>
            <code>value="{fahrenheit}"</code>
          </div>
        </div>
        <figcaption className="small muted">The highlighted child is the one you typed in last.</figcaption>
      </figure>
    </div>
  );
}
