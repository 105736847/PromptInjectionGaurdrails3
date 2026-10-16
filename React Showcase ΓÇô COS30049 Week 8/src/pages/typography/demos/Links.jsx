import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, ExternalLink, Hash, Mail, Phone, RefreshCw } from 'lucide-react';

/**
 * Links – the many jobs of the humble <a> element.
 *
 * - <Link to> (React Router) changes the URL WITHOUT reloading: React just
 *   swaps components, so app state (theme, toasts…) survives.
 * - <a href> to your own route reloads the whole app from the server.
 * - External links opening a new tab need rel="noreferrer" (it also implies
 *   "noopener", so the new page cannot control this tab via window.opener).
 */
const notes = 'COS30049 team meeting\n- Agree on the API contract\n- Split front-end pages\n';
// A "data:" URL embeds the file contents directly in the link.
const notesHref = `data:text/plain;charset=utf-8,${encodeURIComponent(notes)}`;
const mailHref = `mailto:tutor@example.edu.au?subject=${encodeURIComponent('COS30049 – question about Assignment 3')}`;

const sections = [
  { id: 'typo-links-plan', title: '1. Plan', text: 'Sketch your pages and components on paper first.' },
  { id: 'typo-links-build', title: '2. Build', text: 'Create one component at a time and test it in the browser.' },
  { id: 'typo-links-ship', title: '3. Ship', text: 'Run npm run build and deploy the dist/ folder.' },
];

export default function Links() {
  const shipRef = useRef(null);

  return (
    <div className="stack-lg">
      <ul className="stack-sm" style={{ paddingLeft: 18, margin: 0 }}>
        <li>
          <Link to="/forms">
            Internal &lt;Link to="/forms"&gt; <ArrowRight size={14} aria-hidden="true" />
          </Link>{' '}
          <span className="muted small">– instant, no page reload (SPA navigation)</span>
        </li>
        <li>
          <a href="/forms">
            Plain &lt;a href="/forms"&gt; <RefreshCw size={14} aria-hidden="true" />
          </a>{' '}
          <span className="muted small">– same page, but the browser reloads everything</span>
        </li>
        <li>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            react.dev <ExternalLink size={14} aria-hidden="true" />
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>{' '}
          <span className="muted small">– external, target="_blank" rel="noreferrer"</span>
        </li>
        <li>
          <a href={mailHref}>
            <Mail size={14} aria-hidden="true" /> Email the tutor
          </a>{' '}
          <span className="muted small">– mailto: opens the mail app (subject is URL-encoded)</span>
        </li>
        <li>
          <a href="tel:+61390000000">
            <Phone size={14} aria-hidden="true" /> +61 3 9000 0000
          </a>{' '}
          <span className="muted small">– tel: dials on phones</span>
        </li>
        <li>
          <a href={notesHref} download="meeting-notes.txt">
            <Download size={14} aria-hidden="true" /> meeting-notes.txt
          </a>{' '}
          <span className="muted small">– the download attribute saves instead of opening</span>
        </li>
      </ul>

      <div className="card card-subtle stack-sm">
        {/* In-page links: href="#id" jumps to the element with that id */}
        <nav aria-label="Project steps" className="row">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="btn btn-sm">
              <Hash size={14} aria-hidden="true" /> {section.title}
            </a>
          ))}
          {/* The React way when there is no URL to share: a ref + scrollIntoView() */}
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => shipRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            scrollIntoView(ship)
          </button>
        </nav>
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            ref={section.id === 'typo-links-ship' ? shipRef : undefined}
            className="card"
            style={{ minHeight: 110 }}
          >
            <h4 className="m-0">{section.title}</h4>
            <p className="muted small m-0">{section.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
