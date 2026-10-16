import { useEffect, useRef, useState } from 'react';
import { Mail, UserPlus, MoveHorizontal } from 'lucide-react';
import './ContainerQueries.css';

/**
 * ContainerQueries – a component that adapts to the space IT is given,
 * not to the size of the whole window. Perfect for reusable components:
 * the same card can sit in a narrow sidebar or a wide main column.
 *
 * The wrapper declares `container-type: inline-size`; the CSS file then uses
 * `@container profile (min-width: 360px) { … }` to restyle the card.
 * React is only used to show the measured width – the layout is pure CSS.
 */
const PRESET_WIDTHS = [260, 420, 640]; // outer widths; the badge shows the inner (content) width

export default function ContainerQueries() {
  const boxRef = useRef(null);
  const [boxWidth, setBoxWidth] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setBoxWidth(Math.round(entry.contentRect.width)));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  // CSS `resize` writes the width straight onto the element's style attribute.
  // The buttons do the same through the ref, so they never fight the drag handle.
  function setWidth(px) {
    boxRef.current.style.width = `${px}px`;
  }

  return (
    <div className="stack">
      <div className="row">
        <span className="small muted">
          <MoveHorizontal size={14} aria-hidden="true" /> Drag the corner handle, or jump to:
        </span>
        {PRESET_WIDTHS.map((px) => (
          <button key={px} type="button" className="btn btn-sm" onClick={() => setWidth(px)}>
            {px}px
          </button>
        ))}
        <span className="badge badge-primary mono">container: {boxWidth}px</span>
      </div>

      <div ref={boxRef} className="layout-cq-box">
        <article className="layout-cq-card">
          <div className="avatar layout-cq-avatar" aria-hidden="true">ML</div>
          <div className="layout-cq-info">
            <h4 className="m-0">Dr Mei Lin</h4>
            <p className="small muted m-0">Tutor · COS30049 Innovation Project</p>
            <p className="layout-cq-bio small m-0">
              Runs the React and FastAPI labs. Consultation: Tuesdays 2–4 pm.
            </p>
          </div>
          <dl className="layout-cq-stats">
            <div><dt>Units</dt><dd>4</dd></div>
            <div><dt>Students</dt><dd>128</dd></div>
            <div><dt>Rating</dt><dd>4.8</dd></div>
          </dl>
          <div className="layout-cq-actions">
            <button type="button" className="btn btn-primary btn-sm"><Mail size={14} /> Message</button>
            <button type="button" className="btn btn-sm"><UserPlus size={14} /> Follow</button>
          </div>
          {/* The text of this badge is set by the container query (content: '…') */}
          <span className="badge badge-code layout-cq-mode" />
        </article>
      </div>
    </div>
  );
}
