/**
 * Controls – two tiny, reusable form components shared by the playgrounds
 * on this page. Writing them once and passing props is exactly how you would
 * build your own component library.
 *
 *   <Segmented label="flex-direction" options={['row', 'column']} value={dir} onChange={setDir} />
 *   <Slider label="gap" value={gap} onChange={setGap} min={0} max={40} unit="px" />
 */
import { useId } from 'react';
import './Controls.css';

// A row of toggle buttons where exactly one is "pressed" – like a radio group.
export function Segmented({ label, options, value, onChange }) {
  const labelId = useId();
  return (
    <div className="layout-control" role="group" aria-labelledby={labelId}>
      <span className="layout-control-label" id={labelId}>
        {label}
      </span>
      <div className="layout-segmented">
        {options.map((option) => (
          <button
            key={String(option)}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
          >
            {String(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

// A labelled range input that also shows its current value.
export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) {
  const id = useId();
  return (
    <div className="layout-control">
      <label className="layout-control-label" htmlFor={id}>
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
