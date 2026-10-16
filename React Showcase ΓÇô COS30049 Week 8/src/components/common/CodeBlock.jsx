/**
 * CodeBlock – shows syntax-highlighted source code with line numbers and a
 * "Copy" button.
 *
 *   <CodeBlock code={source} filename="Counter.jsx" />
 */
import { useMemo, useState } from 'react';
import { highlight } from 'sugar-high';
import { Check, Copy } from 'lucide-react';

const LANGUAGES = { css: 'css', json: 'json', html: 'html', sh: 'shell', py: 'python' };

function languageFromFilename(filename = '') {
  const extension = filename.split('.').pop();
  return LANGUAGES[extension] ?? 'javascript'; // .js / .jsx → JavaScript (incl. JSX)
}

export default function CodeBlock({ code, filename, language }) {
  const [copied, setCopied] = useState(false);
  const lang = language ?? languageFromFilename(filename);

  // Highlighting is relatively expensive, so only redo it when the code changes.
  const html = useMemo(() => highlight(code.trimEnd(), { lang }), [code, lang]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked (e.g. insecure context) – fail quietly.
    }
  }

  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span>{filename ?? lang}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        {/* dangerouslySetInnerHTML inserts raw HTML. It is only safe here because
            the string comes from our OWN source files, never from user input. */}
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
