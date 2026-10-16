import { useState } from 'react';
import { Segmented } from './Controls.jsx';
import './PatternGallery.css';

/**
 * PatternGallery – layouts you will build again and again, each needing only
 * a few lines of CSS. Every tile shows the live result plus the key rules
 * (the complete CSS is in PatternGallery.css).
 */
function Pattern({ title, css, children }) {
  return (
    <figure className="layout-pattern">
      <figcaption>{title}</figcaption>
      <div className="layout-pattern-demo">{children}</div>
      <pre className="layout-pattern-code">{css}</pre>
    </figure>
  );
}

const CENTER_WAYS = {
  flex: '.parent {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}',
  grid: '.parent {\n  display: grid;\n  place-items: center;\n}',
  absolute: '.parent { position: relative; }\n.child {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n}',
};

const RATIOS = ['16 / 9', '4 / 3', '1 / 1', '9 / 16'];

const WEEKS = [
  { week: 'Week 6', topics: ['Git branching', 'Code review', 'Unit tests'] },
  { week: 'Week 7', topics: ['FastAPI routes', 'Pydantic models', 'CORS'] },
  { week: 'Week 8', topics: ['React components', 'State & props', 'Styling'] },
  { week: 'Week 9', topics: ['Charts with D3', 'Deployment', 'Demo prep'] },
];

const NOTES = [
  'Standup at 10 am',
  'Train the model again with the cleaned dataset before Friday',
  'Fix CORS',
  'Ask tutor about the rubric for the final presentation and the report word count',
  'Buy coffee ☕',
  'Record the demo video',
];

export default function PatternGallery() {
  const [centerWay, setCenterWay] = useState('flex');
  const [ratio, setRatio] = useState('16 / 9');

  return (
    <div className="layout-patterns">
      <Pattern title="Perfect centring – 3 ways" css={CENTER_WAYS[centerWay]}>
        <Segmented label="method" options={Object.keys(CENTER_WAYS)} value={centerWay} onChange={setCenterWay} />
        <div className={`layout-center layout-center-${centerWay}`}>
          <span className="layout-center-child">Centred!</span>
        </div>
      </Pattern>

      <Pattern title="Push the last item to the end" css={'.nav { display: flex; gap: 8px; }\n.login { margin-left: auto; }'}>
        <nav className="layout-nav" aria-label="Pattern example">
          <strong>🎓 Portal</strong>
          <span>Units</span>
          <span>Grades</span>
          <button type="button" className="btn btn-primary btn-sm layout-nav-end">Log in</button>
        </nav>
      </Pattern>

      <Pattern
        title="Sidebar that wraps – no media query"
        css={'.layout { display: flex; flex-wrap: wrap; }\n.side { flex: 1 1 90px; }\n.main { flex: 999 1 170px; }'}
      >
        <div className="layout-sidebar">
          <div className="layout-sidebar-side">Sidebar</div>
          <div className="layout-sidebar-main">Main content grows; the sidebar wraps on top when space runs out.</div>
        </div>
        <p className="hint m-0">↔ Drag the corner of this tile’s box to resize it.</p>
      </Pattern>

      <Pattern title="Sticky headers in a scroll box" css={'.list { max-height: 180px; overflow-y: auto; }\n.list h4 { position: sticky; top: 0; }'}>
        <div className="layout-sticky-list" tabIndex={0} role="region" aria-label="Weekly topics (scrollable)">
          {WEEKS.map((item) => (
            <section key={item.week}>
              <h4>{item.week}</h4>
              <ul>
                {item.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Pattern>

      <Pattern title="Masonry-style columns" css={'.notes { columns: 2 110px; column-gap: 8px; }\n.note { break-inside: avoid; }'}>
        <div className="layout-masonry">
          {NOTES.map((note) => (
            <p key={note} className="layout-masonry-note">{note}</p>
          ))}
        </div>
      </Pattern>

      <Pattern title="aspect-ratio boxes" css={`.video {\n  height: 130px;\n  aspect-ratio: ${ratio};\n}`}>
        <Segmented label="aspect-ratio" options={RATIOS} value={ratio} onChange={setRatio} />
        <div className="layout-ratio-box" style={{ aspectRatio: ratio }}>
          {ratio}
        </div>
      </Pattern>
    </div>
  );
}
