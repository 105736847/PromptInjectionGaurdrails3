import { useState } from 'react';
import { ImageOff, RotateCcw } from 'lucide-react';
import Slider from './Slider.jsx';
import './FiltersPlayground.css';

/**
 * FiltersPlayground – CSS `filter` applies photo-editor effects to ANY
 * element: images, text, even a whole card. Functions can be chained:
 *
 *   filter: sepia(60%) contrast(110%) blur(1px);
 *
 * The filter string is derived from state; only the values you changed
 * from their defaults are included.
 */
const FILTERS = [
  { name: 'blur', unit: 'px', max: 10, step: 0.5, initial: 0 },
  { name: 'brightness', unit: '%', max: 200, initial: 100 },
  { name: 'contrast', unit: '%', max: 200, initial: 100 },
  { name: 'grayscale', unit: '%', max: 100, initial: 0 },
  { name: 'hue-rotate', unit: 'deg', max: 360, initial: 0 },
  { name: 'sepia', unit: '%', max: 100, initial: 0 },
  { name: 'saturate', unit: '%', max: 300, initial: 100 },
];
const INITIAL = Object.fromEntries(FILTERS.map((f) => [f.name, f.initial]));

const PRESETS = {
  Vintage: { sepia: 60, contrast: 110, brightness: 105, saturate: 80 },
  Noir: { grayscale: 100, contrast: 150, brightness: 90 },
  Vivid: { saturate: 190, contrast: 115 },
  Dream: { blur: 1.5, brightness: 115, 'hue-rotate': 300, saturate: 140 },
};

const IMAGE_URL = 'https://picsum.photos/seed/cos30049-campus/720/450';

export default function FiltersPlayground() {
  const [values, setValues] = useState(INITIAL);
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'

  const filter =
    FILTERS.filter((f) => values[f.name] !== f.initial)
      .map((f) => `${f.name}(${values[f.name]}${f.unit})`)
      .join(' ') || 'none';

  const setOne = (name) => (value) => setValues((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="grid-2">
      <div className="stack-sm">
        <div className="row">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button key={name} type="button" className="btn btn-secondary btn-sm" onClick={() => setValues({ ...INITIAL, ...preset })}>
              {name}
            </button>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setValues(INITIAL)}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        {FILTERS.map((f) => (
          <Slider
            key={f.name}
            label={f.name}
            value={values[f.name]}
            onChange={setOne(f.name)}
            max={f.max}
            step={f.step}
            unit={f.unit}
          />
        ))}
      </div>

      <div className="stack">
        <figure className="styling-filter-figure">
          {status === 'loading' && (
            <div className="styling-filter-status" role="status">
              <span className="spinner" aria-hidden="true" /> Loading image…
            </div>
          )}
          {status === 'error' ? (
            // Network problems happen – show something useful instead of a broken image icon.
            <div className="styling-filter-fallback" style={{ filter }}>
              <ImageOff size={28} aria-hidden="true" />
              <span>Image failed to load – the filters still work on this gradient.</span>
            </div>
          ) : (
            <img
              src={IMAGE_URL}
              alt="Sample landscape photo from picsum.photos"
              style={{ filter }}
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('error')}
            />
          )}
        </figure>
        <pre className="demo-output">{`filter: ${filter};`}</pre>
      </div>
    </div>
  );
}
