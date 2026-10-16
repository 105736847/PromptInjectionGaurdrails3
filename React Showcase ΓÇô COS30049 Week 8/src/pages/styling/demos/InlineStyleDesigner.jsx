import { useId, useState } from 'react';
import { CalendarClock, RotateCcw } from 'lucide-react';
import Slider from './Slider.jsx';

/**
 * InlineStyleDesigner – the `style` prop takes a JavaScript OBJECT, not a string:
 *
 *   HTML:  style="border-radius: 16px; background-color: #4f46e5"
 *   React: style={{ borderRadius: 16, backgroundColor: '#4f46e5' }}
 *
 * - property names are camelCase (borderRadius, not border-radius)
 * - plain numbers get "px" added automatically… except for unitless
 *   properties such as opacity, zIndex, lineHeight and flexGrow
 * - the outer {} means "JavaScript here", the inner {} is the object itself
 */
const DEFAULTS = { radius: 16, padding: 24, blur: 24, rotate: -3, opacity: 1, color: '#4f46e5' };

// Choose dark or light text depending on how bright the background is.
function readableTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness > 0.6 ? '#111827' : '#ffffff';
}

export default function InlineStyleDesigner() {
  const [design, setDesign] = useState(DEFAULTS);
  const colorId = useId();

  // set('radius') returns a function that updates only that key.
  const set = (key) => (value) => setDesign((prev) => ({ ...prev, [key]: value }));

  // The style object is DERIVED from state on every render.
  const cardStyle = {
    backgroundColor: design.color,
    color: readableTextColor(design.color),
    borderRadius: design.radius, // number → "16px"
    padding: design.padding,
    boxShadow: `0 ${Math.round(design.blur / 3)}px ${design.blur}px rgb(0 0 0 / 0.3)`,
    transform: `rotate(${design.rotate}deg)`,
    opacity: design.opacity, // unitless → stays 0.9, no "px"
  };

  return (
    <div className="grid-2">
      <div className="stack">
        <Slider label="Border radius" value={design.radius} onChange={set('radius')} max={48} unit="px" />
        <Slider label="Padding" value={design.padding} onChange={set('padding')} min={8} max={48} unit="px" />
        <Slider label="Shadow blur" value={design.blur} onChange={set('blur')} max={60} unit="px" />
        <Slider label="Rotation" value={design.rotate} onChange={set('rotate')} min={-15} max={15} unit="°" />
        <Slider label="Opacity" value={design.opacity} onChange={set('opacity')} min={0.2} max={1} step={0.05} />
        <div className="row">
          <label className="label" htmlFor={colorId}>Background</label>
          <input
            id={colorId}
            type="color"
            className="input"
            value={design.color}
            onChange={(event) => set('color')(event.target.value)}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDesign(DEFAULTS)}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="stack">
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 200, padding: 24 }}>
          <article style={cardStyle}>
            <CalendarClock size={22} aria-hidden="true" />
            <h4 style={{ margin: '8px 0 4px' }}>Assignment 3 due</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Friday, 11:59 pm · Canvas</p>
          </article>
        </div>
        <pre className="demo-output">{`style={${JSON.stringify(cardStyle, null, 2)}}`}</pre>
      </div>
    </div>
  );
}
