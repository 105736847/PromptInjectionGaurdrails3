import { useState } from 'react';
import styles from './Landmarks.module.css';

/**
 * Semantic page landmarks – a labelled mock-up of a typical page.
 *
 * <div> tells the browser nothing. Semantic elements describe the ROLE of
 * each area, so screen-reader users can jump straight to "main" or
 * "navigation", and search engines understand the page.
 * Click a label to learn what each element is for.
 */
const INFO = {
  header: 'Introductory content: logo, site name, maybe a search box. At the top of the page it becomes the "banner" landmark.',
  nav: 'A block of major navigation links. Give it an aria-label if there is more than one nav on the page.',
  main: 'The unique main content of the page. Only ONE visible <main> is allowed, so this mock-up uses a <div> – this showcase already has a real <main>.',
  article: 'Self-contained content that would make sense on its own: a blog post, a news story, a product card, a forum reply.',
  section: 'A thematic group of content, normally with its own heading. If there is no natural heading, a <div> is probably right.',
  aside: 'Content only loosely related to the main content: a sidebar, related links, a glossary box.',
  footer: 'Closing information for its section or the page: copyright, contact links, sitemap.',
  address: 'Contact details for the nearest <article> or the whole page – not for any random postal address.',
};

// A small helper component. `as` lets the caller choose which element to render.
function Region({ tag, as: Tag = tag, active, onSelect, className = '', children, ...rest }) {
  return (
    <Tag className={`${styles.region} ${active === tag ? styles.active : ''} ${className}`} {...rest}>
      <button type="button" className={styles.chip} aria-pressed={active === tag} onClick={() => onSelect(tag)}>
        &lt;{tag}&gt;
      </button>
      {children}
    </Tag>
  );
}

export default function Landmarks() {
  const [active, setActive] = useState('main');
  const shared = { active, onSelect: setActive };

  return (
    <div className="stack">
      <div className={styles.page}>
        <Region tag="header" {...shared} className={styles.header}>
          <strong>StudyHub</strong>
          {/* Extra props (aria-label) are passed through to the <nav> via ...rest */}
          <Region tag="nav" {...shared} className={styles.nav} aria-label="Mock-up navigation">
            <div className="row small">
              <span>Home</span><span>Units</span><span>Timetable</span>
            </div>
          </Region>
        </Region>

        <Region tag="main" as="div" {...shared} className={styles.main}>
          <Region tag="article" {...shared} className={styles.article}>
            <strong>Getting started with React</strong>
            <Region tag="section" {...shared}>
              <span className="small muted">Installing Node.js…</span>
            </Region>
            <Region tag="section" {...shared}>
              <span className="small muted">Your first component…</span>
            </Region>
          </Region>
          <Region tag="aside" {...shared} className={styles.aside}>
            <span className="small muted">Related: JSX cheatsheet</span>
          </Region>
        </Region>

        <Region tag="footer" {...shared} className={styles.footer}>
          <span className="small">© 2026 StudyHub</span>
          <Region tag="address" {...shared}>
            <span className="small">help@studyhub.example</span>
          </Region>
        </Region>
      </div>

      <div className="alert alert-info" aria-live="polite">
        <span className="badge badge-code">&lt;{active}&gt;</span>
        <span>{INFO[active]}</span>
      </div>
    </div>
  );
}
