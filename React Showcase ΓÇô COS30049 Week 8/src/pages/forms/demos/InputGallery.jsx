import { useId, useState } from 'react';
import styles from './InputGallery.module.css';

/**
 * Every HTML input type, each showing its CURRENT VALUE live.
 *
 * Notice what event.target gives you:
 *   - text-like inputs, date/time, color, range → e.target.value (always a STRING!)
 *   - checkbox → e.target.checked (boolean)
 *   - file → e.target.files (a FileList)
 *   - <select multiple> → e.target.selectedOptions
 */
const SIMPLE_INPUTS = [
  { type: 'text', initial: 'Hello React', props: { placeholder: 'Any text' } },
  { type: 'search', initial: '', props: { placeholder: 'Search units…' } },
  { type: 'email', initial: 'alex@example.edu.au' },
  { type: 'password', initial: 'secret123' },
  { type: 'number', initial: '42', props: { min: 0, max: 100, step: 1 } },
  { type: 'tel', initial: '+61 412 345 678' },
  { type: 'url', initial: 'https://react.dev' },
  { type: 'date', initial: '2026-10-23' },
  { type: 'time', initial: '14:30' },
  { type: 'datetime-local', initial: '2026-10-23T14:30' },
  { type: 'month', initial: '2026-10', note: 'Not supported in Firefox/Safari (shows a text box)' },
  { type: 'week', initial: '2026-W43', note: 'Not supported in Firefox/Safari (shows a text box)' },
  { type: 'color', initial: '#0e9f8e' },
  { type: 'range', initial: '60', props: { min: 0, max: 100 } },
];
const SIZES = ['Small', 'Medium', 'Large'];
const TECH = ['React', 'Vue', 'Angular', 'Svelte', 'FastAPI'];

// One card: label, the control, and its live value.
function Tile({ id, label, value, note, labelable = true, children }) {
  return (
    <div className={styles.tile}>
      {/* A <label htmlFor> must point at a control that CAN be labelled. <input type="hidden">
          can't (nobody can see or click it), so its title is a plain <span> instead. */}
      {labelable ? (
        <label htmlFor={id} className="badge badge-code">{label}</label>
      ) : (
        <span className="badge badge-code">{label}</span>
      )}
      {children}
      {note && <span className="subtle small">{note}</span>}
      <output htmlFor={id} className={styles.value}>{JSON.stringify(value)}</output>
    </div>
  );
}

export default function InputGallery() {
  const uid = useId();
  const [values, setValues] = useState(() => ({
    ...Object.fromEntries(SIMPLE_INPUTS.map((i) => [i.type, i.initial])),
    checkbox: true,
    radio: 'Medium',
    file: [],
    select: 'React',
    multi: ['React', 'FastAPI'],
    textarea: 'Line one\nLine two',
    datalist: '',
  }));
  const update = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div className={styles.grid}>
      {SIMPLE_INPUTS.map(({ type, props, note }) => (
        <Tile key={type} id={`${uid}-${type}`} label={`type="${type}"`} value={values[type]} note={note}>
          <input id={`${uid}-${type}`} type={type} className={type === 'range' ? undefined : 'input'}
            value={values[type]} onChange={(e) => update(type, e.target.value)} {...props} />
        </Tile>
      ))}

      <Tile id={`${uid}-checkbox`} label='type="checkbox"' value={values.checkbox}>
        <label className="check">
          <input id={`${uid}-checkbox`} type="checkbox" checked={values.checkbox} onChange={(e) => update('checkbox', e.target.checked)} />
          Email me updates
        </label>
      </Tile>

      <Tile id={`${uid}-radio`} label='type="radio"' value={values.radio}>
        <div className="row" role="radiogroup" aria-label="T-shirt size">
          {SIZES.map((size) => (
            <label key={size} className="check">
              <input type="radio" name={`${uid}-size`} value={size} checked={values.radio === size}
                onChange={(e) => update('radio', e.target.value)} id={size === SIZES[0] ? `${uid}-radio` : undefined} />
              {size}
            </label>
          ))}
        </div>
      </Tile>

      <Tile id={`${uid}-file`} label='type="file"' value={values.file}>
        {/* Uncontrolled: we only READ the FileList, we never set it */}
        <input id={`${uid}-file`} type="file" multiple className="input"
          onChange={(e) => update('file', Array.from(e.target.files, (f) => f.name))} />
      </Tile>

      <Tile id={`${uid}-hidden`} label='type="hidden"' value="team-42" labelable={false}>
        <input id={`${uid}-hidden`} type="hidden" name="teamId" value="team-42" />
        <span className="small muted">Invisible, but its value is sent with the form – e.g. a record ID.</span>
      </Tile>

      <Tile id={`${uid}-select`} label="<select>" value={values.select}>
        <select id={`${uid}-select`} className="input" value={values.select} onChange={(e) => update('select', e.target.value)}>
          <optgroup label="Front-end">
            {TECH.slice(0, 4).map((t) => <option key={t}>{t}</option>)}
          </optgroup>
          <optgroup label="Back-end">
            <option>FastAPI</option>
          </optgroup>
        </select>
      </Tile>

      <Tile id={`${uid}-multi`} label="<select multiple>" value={values.multi}>
        <select id={`${uid}-multi`} multiple size={4} className="input" value={values.multi}
          onChange={(e) => update('multi', Array.from(e.target.selectedOptions, (o) => o.value))}>
          {TECH.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span className="subtle small">Ctrl / ⌘ + click to pick several</span>
      </Tile>

      <Tile id={`${uid}-textarea`} label="<textarea>" value={values.textarea}>
        <textarea id={`${uid}-textarea`} className="input" rows={3} value={values.textarea}
          onChange={(e) => update('textarea', e.target.value)} />
      </Tile>

      <Tile id={`${uid}-datalist`} label="<input list> + <datalist>" value={values.datalist}>
        {/* A datalist gives suggestions, but the user may still type anything */}
        <input id={`${uid}-datalist`} className="input" list={`${uid}-langs`} placeholder="Start typing a language…"
          value={values.datalist} onChange={(e) => update('datalist', e.target.value)} />
        <datalist id={`${uid}-langs`}>
          {['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust'].map((l) => <option key={l} value={l} />)}
        </datalist>
      </Tile>
    </div>
  );
}
