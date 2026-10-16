import { useState } from 'react';
import { Send } from 'lucide-react';
import styles from './CssModuleButton.module.css';

/**
 * CssModuleButton – CSS Modules give each component its own private class names.
 *
 *   import styles from './CssModuleButton.module.css';
 *   <button className={styles.primary}>…</button>
 *
 * `styles` is a plain object that maps the names you wrote to the unique,
 * generated names Vite put in the real stylesheet. Printing it below proves
 * the classes are scoped to this file.
 */
export default function CssModuleButton() {
  const [variant, setVariant] = useState('primary'); // 'primary' | 'outline'
  const [large, setLarge] = useState(false);

  // Combine module classes like any other strings.
  const className = [styles[variant], large && styles.large].filter(Boolean).join(' ');

  return (
    <div className="grid-2">
      <div className="stack">
        <div className="row">
          <div className="btn-group" role="group" aria-label="Variant">
            {['primary', 'outline'].map((name) => (
              <button
                key={name}
                type="button"
                className={`btn btn-sm ${variant === name ? 'active' : ''}`}
                aria-pressed={variant === name}
                onClick={() => setVariant(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={large} onChange={(event) => setLarge(event.target.checked)} />
            large
          </label>
        </div>

        <div>
          <button type="button" className={className}>
            <Send size={16} /> Submit report
          </button>
        </div>

        <div>
          {/* A plain, global "button" class: nothing matches it, because the
              module's .button was renamed. Proof that there is no clash. */}
          <button type="button" className="button">className=&quot;button&quot; (global – unstyled)</button>
        </div>
      </div>

      <div className="stack-sm">
        <span className="small muted">
          <code>{'className={styles.' + variant + '}'}</code> actually renders:
        </span>
        <pre className="demo-output m-0">{className}</pre>
        <span className="small muted">
          The whole <code>styles</code> object:
        </span>
        <pre className="demo-output m-0">{JSON.stringify(styles, null, 2)}</pre>
      </div>
    </div>
  );
}
