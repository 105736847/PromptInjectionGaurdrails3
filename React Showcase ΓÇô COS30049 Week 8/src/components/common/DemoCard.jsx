/**
 * DemoCard – the building block of every page in this showcase.
 * It shows a live, working example ("Preview") and the exact source code
 * that produces it ("Code").
 *
 * Single file:
 *   import Counter from './demos/Counter.jsx';
 *   import counterCode from './demos/Counter.jsx?raw';   // ?raw = import file as text (Vite feature)
 *
 *   <DemoCard title="Counter" description="..." concepts={['useState']}
 *             code={counterCode} filename="Counter.jsx">
 *     <Counter />
 *   </DemoCard>
 *
 * Several files (e.g. a component and its CSS):
 *   <DemoCard title="..." files={[{ name: 'Box.jsx', code: boxCode }, { name: 'Box.module.css', code: cssCode }]}>
 */
import { useId, useState } from 'react';
import { Code2, Eye } from 'lucide-react';
import CodeBlock from './CodeBlock.jsx';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function DemoCard({ title, description, concepts = [], code, filename, files, id, children }) {
  const [view, setView] = useState('preview'); // 'preview' | 'code'
  const [activeFile, setActiveFile] = useState(0);
  const tabsId = useId(); // unique id for accessibility attributes

  // Normalise the two ways of passing code into one array of files.
  const sourceFiles = files ?? (code ? [{ name: filename ?? 'Example.jsx', code }] : []);
  const hasCode = sourceFiles.length > 0;

  return (
    <section className="demo-card" id={id ?? slugify(title)} aria-labelledby={`${tabsId}-title`}>
      <header className="demo-card-header">
        <div>
          <h3 id={`${tabsId}-title`}>{title}</h3>
          {description && <p>{description}</p>}
          {concepts.length > 0 && (
            <ul className="concept-list" aria-label="Concepts used">
              {concepts.map((concept) => (
                <li key={concept} className="badge badge-code">
                  {concept}
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasCode && (
          <div className="demo-tabs" role="tablist" aria-label={`${title} view`}>
            <button
              type="button"
              role="tab"
              id={`${tabsId}-tab-preview`}
              aria-controls={`${tabsId}-panel-preview`}
              aria-selected={view === 'preview'}
              onClick={() => setView('preview')}
            >
              <Eye size={15} /> Preview
            </button>
            <button
              type="button"
              role="tab"
              id={`${tabsId}-tab-code`}
              aria-controls={`${tabsId}-panel-code`}
              aria-selected={view === 'code'}
              onClick={() => setView('code')}
            >
              <Code2 size={15} /> Code
            </button>
          </div>
        )}
      </header>

      {/* The preview stays mounted (just hidden) while viewing the code,
          so the demo keeps its state when students switch back and forth. */}
      <div
        className="demo-preview"
        role={hasCode ? 'tabpanel' : undefined}
        id={`${tabsId}-panel-preview`}
        aria-labelledby={hasCode ? `${tabsId}-tab-preview` : undefined}
        hidden={view !== 'preview'}
      >
        {children}
      </div>

      {hasCode && view === 'code' && (
        <div
          className="demo-code"
          role="tabpanel"
          id={`${tabsId}-panel-code`}
          aria-labelledby={`${tabsId}-tab-code`}
        >
          {sourceFiles.length > 1 && (
            <div className="file-tabs" role="tablist" aria-label="Source files">
              {sourceFiles.map((file, index) => (
                <button
                  key={file.name}
                  type="button"
                  role="tab"
                  aria-selected={activeFile === index}
                  onClick={() => setActiveFile(index)}
                >
                  {file.name}
                </button>
              ))}
            </div>
          )}
          <CodeBlock code={sourceFiles[activeFile].code} filename={sourceFiles[activeFile].name} />
        </div>
      )}
    </section>
  );
}
