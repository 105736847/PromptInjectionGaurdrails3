/**
 * SnippetTabs – several read-only code files behind accessible tabs.
 * Used for the FastAPI → JSON → React walkthrough (the code is shown, not run).
 * Tabs follow the ARIA pattern: ← → move between tabs, the panel is labelled by its tab.
 */
import { useId, useRef, useState } from 'react';
import CodeBlock from '../../../components/common/CodeBlock.jsx';

export default function SnippetTabs({ files, label }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef([]);
  const id = useId();

  function handleKeyDown(event) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (active + step + files.length) % files.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div className="file-tabs" role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
        {files.map((file, i) => (
          <button key={file.name} ref={(el) => { tabRefs.current[i] = el; }} type="button" role="tab"
            id={`${id}-tab-${i}`} aria-controls={`${id}-panel`} aria-selected={active === i}
            tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)}>
            {file.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
        <CodeBlock code={files[active].code} filename={files[active].title} language={files[active].language} />
      </div>
    </div>
  );
}
