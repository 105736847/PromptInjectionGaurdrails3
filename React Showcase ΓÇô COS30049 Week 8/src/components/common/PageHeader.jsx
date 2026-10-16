/**
 * PageHeader – the title block at the top of every page.
 *
 *   <PageHeader
 *     eyebrow="React Fundamentals"
 *     title="State & Events"
 *     intro="State is data that changes over time..."
 *     concepts={['useState', 'onClick', 'useReducer']}
 *     docs={[{ label: 'useState', href: 'https://react.dev/reference/react/useState' }]}
 *   />
 */
import { ExternalLink } from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

export default function PageHeader({ eyebrow, title, intro, concepts = [], docs = [] }) {
  useDocumentTitle(title);

  return (
    <header className="page-header">
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {intro && <p className="page-intro">{intro}</p>}

      {(concepts.length > 0 || docs.length > 0) && (
        <div className="page-meta">
          {concepts.length > 0 && (
            <ul className="concept-list" aria-label="Concepts on this page">
              {concepts.map((concept) => (
                <li key={concept} className="badge badge-primary">
                  {concept}
                </li>
              ))}
            </ul>
          )}
          {docs.length > 0 && (
            <nav className="docs-links" aria-label="Official documentation">
              {docs.map((doc) => (
                <a key={doc.href} href={doc.href} target="_blank" rel="noreferrer">
                  {doc.label} <ExternalLink size={13} aria-hidden="true" />
                </a>
              ))}
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
