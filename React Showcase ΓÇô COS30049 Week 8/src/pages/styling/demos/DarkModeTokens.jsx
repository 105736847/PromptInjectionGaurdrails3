import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext.jsx';

/**
 * DarkModeTokens – how this whole app does light & dark mode.
 *
 * 1. ThemeContext stores 'light' | 'dark' and writes it to <html data-theme="…">.
 * 2. index.css defines every colour as a variable, twice:
 *      :root                { --color-bg: #f6f7fb; … }
 *      [data-theme='dark']  { --color-bg: #0f1218; … }
 * 3. Components only ever use var(--color-bg), so they never need to know the theme.
 *
 * The table reads the CURRENT values with getComputedStyle(), so you can
 * watch them change when you flip the theme (here or in the header).
 */
const TOKENS = [
  '--color-bg',
  '--color-surface',
  '--color-surface-2',
  '--color-border',
  '--color-text',
  '--color-text-muted',
  '--color-primary',
  '--color-primary-soft',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-info',
];

function readTokens() {
  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(TOKENS.map((name) => [name, styles.getPropertyValue(name).trim()]));
}

export default function DarkModeTokens() {
  const { theme, toggleTheme } = useTheme();
  const [values, setValues] = useState(readTokens); // lazy initial state: read once on mount

  useEffect(() => {
    // Why not just re-read in an effect that depends on `theme`? Because the
    // ThemeProvider sets data-theme in ITS effect, and parent effects run AFTER
    // child effects – we would read the old colours. Instead we watch the
    // attribute itself and re-read whenever it actually changes.
    const observer = new MutationObserver(() => setValues(readTokens()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={toggleTheme}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          Switch to {isDark ? 'light' : 'dark'} mode
        </button>
        <span className="small muted">
          <code>useTheme().theme</code> is <strong className="mono">'{theme}'</strong>
        </span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Swatch</th>
              <th>Computed value ({theme})</th>
            </tr>
          </thead>
          <tbody>
            {TOKENS.map((name) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td>
                  {/* The swatch uses the variable directly – CSS keeps it up to date */}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 56,
                      height: 22,
                      borderRadius: 6,
                      border: '1px solid var(--color-border-strong)',
                      background: `var(${name})`,
                    }}
                  />
                </td>
                <td className="mono">{values[name]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
