import { useState } from 'react';
import {
  BookOpen, Brain, Bug, Calendar, Camera, ChartLine, Check, Cloud, Code, Copy, Cpu, Database,
  GitBranch, GraduationCap, Heart, Laptop, Lock, Mail, MapPin, Moon, Rocket, Search, Server,
  Settings, Sparkles, Star, Sun, Users,
} from 'lucide-react';

/**
 * Icons with lucide-react: every icon is a React component that renders an <svg>.
 *
 *   import { Rocket } from 'lucide-react';
 *   <Rocket size={32} color="#4f46e5" strokeWidth={1.5} />
 *
 * Import only the icons you use – the bundler leaves the other 1,500+ out.
 * Components are just values, so we can keep them in an object and loop over it.
 */
const ICONS = {
  Rocket, Brain, Cpu, Database, Server, Code, Bug, GitBranch, Cloud, Laptop, Lock, Mail,
  Calendar, MapPin, Heart, Star, Search, Settings, Users, BookOpen, GraduationCap, ChartLine,
  Sparkles, Camera, Sun, Moon,
};
const COLORS = ['currentColor', '#4f46e5', '#0e9f8e', '#e8833a', '#d9467a'];

export default function IconGallery() {
  const [query, setQuery] = useState('');
  const [size, setSize] = useState(28);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState('currentColor');
  const [selected, setSelected] = useState('Rocket');
  const [copied, setCopied] = useState(false);

  const names = Object.keys(ICONS).filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  const Selected = ICONS[selected]; // a component stored in a variable must be Capitalised
  const snippet = `<${selected} size={${size}} color="${color}" strokeWidth={${strokeWidth}} />`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked – ignore
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <input className="input" style={{ maxWidth: 200 }} type="search" placeholder="Filter icons…" aria-label="Filter icons"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="row small" style={{ gap: 6 }}>
          size <input type="range" min="16" max="56" value={size} onChange={(e) => setSize(Number(e.target.value))} /> {size}
        </label>
        <label className="row small" style={{ gap: 6 }}>
          strokeWidth <input type="range" min="0.5" max="3" step="0.25" value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))} /> {strokeWidth}
        </label>
        <div className="row" style={{ gap: 4 }} role="group" aria-label="Colour">
          {COLORS.map((c) => (
            <button key={c} type="button" className={`btn btn-sm ${color === c ? 'btn-secondary' : ''}`}
              aria-pressed={color === c} onClick={() => setColor(c)}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: c === 'currentColor' ? 'var(--color-text)' : c }} />
              {c === 'currentColor' ? 'current' : c}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
        {names.map((name) => {
          const Icon = ICONS[name];
          return (
            <li key={name}>
              <button type="button" onClick={() => setSelected(name)} aria-pressed={selected === name}
                className="card card-hover stack-sm"
                style={{
                  width: '100%', padding: 10, alignItems: 'center', cursor: 'pointer', color: 'var(--color-text)', font: 'inherit',
                  borderColor: selected === name ? 'var(--color-primary)' : undefined,
                }}>
                <Icon size={size} color={color} strokeWidth={strokeWidth} aria-hidden="true" />
                <span className="subtle" style={{ fontSize: '0.7rem' }}>{name}</span>
              </button>
            </li>
          );
        })}
        {names.length === 0 && <li className="muted small">No icon matches “{query}”.</li>}
      </ul>

      <div className="card card-subtle row">
        <Selected size={48} color={color} strokeWidth={strokeWidth} aria-hidden="true" />
        <code className="small" style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{snippet}</code>
        <button type="button" className="btn btn-sm" onClick={copy}>
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied ? 'Copied' : 'Copy JSX'}
        </button>
      </div>
      <p className="hint m-0">
        Icons that only decorate text get <code>aria-hidden="true"</code>. An icon-only button needs an{' '}
        <code>aria-label</code> so screen readers can announce it.
      </p>
    </div>
  );
}
