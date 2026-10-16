/**
 * Slider – a labelled <input type="range"> that also shows its value.
 * A tiny reusable component shared by several demos on this page.
 *
 *   <Slider label="Border radius" value={radius} onChange={setRadius} max={48} unit="px" />
 */
import { useId } from 'react';
import './Slider.css';

export default function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) {
  const id = useId(); // unique id so the <label> is linked to its input
  return (
    <div className="styling-slider">
      <label htmlFor={id}>
        {label}
        <output htmlFor={id}>
          {value}
          {unit}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        // Range inputs give us a string – convert it so state stays a number.
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
