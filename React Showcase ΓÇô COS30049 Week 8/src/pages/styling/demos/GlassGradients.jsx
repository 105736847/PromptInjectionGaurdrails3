import { useId, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import Slider from './Slider.jsx';
import './GlassGradients.css';

/**
 * GlassGradients – three "visual effect" features of modern CSS:
 *   backdrop-filter  blurs whatever is BEHIND an element → frosted glass
 *   mix-blend-mode   mixes an element's colours with the pixels under it
 *   *-gradient()     images made of colours – no image files needed
 * The sliders feed CSS custom properties; the CSS file does the rest.
 */
const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'difference', 'exclusion'];

const GRADIENTS = [
  { name: 'linear', css: 'linear-gradient(135deg, var(--chart-1), var(--chart-4))' },
  { name: 'radial', css: 'radial-gradient(circle at 30% 30%, var(--chart-3), var(--chart-6))' },
  { name: 'conic', css: 'conic-gradient(var(--chart-1), var(--chart-2), var(--chart-3), var(--chart-4), var(--chart-1))' },
  { name: 'repeating', css: 'repeating-linear-gradient(45deg, var(--chart-2) 0 10px, var(--chart-5) 10px 20px)' },
];

export default function GlassGradients() {
  const [blur, setBlur] = useState(12);
  const [tint, setTint] = useState(40);
  const [blend, setBlend] = useState('difference');
  const selectId = useId();

  return (
    <div className="stack-lg">
      <div className="grid-2">
        <div className="stack">
          <Slider label="backdrop-filter: blur()" value={blur} onChange={setBlur} max={30} unit="px" />
          <Slider label="glass background opacity" value={tint} onChange={setTint} max={100} unit="%" />
          <div className="field">
            <label className="label" htmlFor={selectId}>mix-blend-mode of the big word</label>
            <select id={selectId} className="input" value={blend} onChange={(event) => setBlend(event.target.value)}>
              {BLEND_MODES.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
          <pre className="demo-output m-0">
            {`.glass {\n  background: color-mix(in srgb, var(--color-surface) ${tint}%, transparent);\n  backdrop-filter: blur(${blur}px) saturate(160%);\n}\n.word { mix-blend-mode: ${blend}; }`}
          </pre>
        </div>

        <div className="styling-glass-scene" style={{ '--glass-blur': `${blur}px`, '--glass-tint': `${tint}%` }}>
          <span className="styling-glass-blob styling-glass-blob-1" />
          <span className="styling-glass-blob styling-glass-blob-2" />
          <span className="styling-glass-blob styling-glass-blob-3" />
          <p className="styling-glass-word" style={{ mixBlendMode: blend }} aria-hidden="true">REACT</p>
          <div className="styling-glass-card">
            <GraduationCap size={24} aria-hidden="true" />
            <strong>Graduation 2026</strong>
            <span className="small">Frosted glass = translucent background + backdrop-filter</span>
          </div>
        </div>
      </div>

      <div className="styling-gradients">
        {GRADIENTS.map((gradient) => (
          <figure key={gradient.name} className="styling-gradient">
            <div className="styling-gradient-swatch" style={{ background: gradient.css }} />
            <figcaption>
              <strong>{gradient.name}</strong>
              <code>{gradient.css}</code>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
