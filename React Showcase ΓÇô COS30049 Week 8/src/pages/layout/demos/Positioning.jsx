import { useState } from 'react';
import { Segmented, Slider } from './Controls.jsx';
import './Positioning.css';

/**
 * Positioning – `position` decides two things:
 *   1. Does the element still take up space in the normal flow?
 *   2. What are `top` / `left` measured from?
 * Pick a value, move the sliders, then SCROLL inside the grey mini-viewport.
 */
const MODES = {
  static: {
    inFlow: true,
    text: 'The default. The box sits in the normal flow and top/left are ignored.',
  },
  relative: {
    inFlow: true,
    text: 'Nudged away from where it would normally be. Its original space is kept, so nothing else moves.',
  },
  absolute: {
    inFlow: false,
    text: 'Taken out of the flow (the siblings close the gap) and placed relative to the nearest POSITIONED ancestor – the dashed parent, which has position: relative.',
  },
  fixed: {
    inFlow: false,
    text: 'Taken out of the flow and pinned to the viewport, so it ignores scrolling. (The grey frame has a transform, which makes it act as the viewport for fixed children – a classic gotcha!)',
  },
  sticky: {
    inFlow: true,
    text: 'Behaves like relative until you scroll past its `top` offset, then sticks to the scroll container – but only while its parent is still visible.',
  },
};

export default function Positioning() {
  const [position, setPosition] = useState('relative');
  const [top, setTop] = useState(20);
  const [left, setLeft] = useState(40);
  const mode = MODES[position];

  const css = `.box {
  position: ${position};
  top: ${top}px;${position === 'static' ? '   /* ignored */' : ''}
  left: ${left}px;${position === 'static' ? '  /* ignored */' : ''}
}`;

  return (
    <div className="layout-pg">
      <div className="layout-pg-controls">
        <Segmented label="position" options={Object.keys(MODES)} value={position} onChange={setPosition} />
        <Slider label="top" value={top} onChange={setTop} max={80} unit="px" />
        <Slider label="left" value={left} onChange={setLeft} max={160} unit="px" />
        <div className={`alert ${mode.inFlow ? 'alert-success' : 'alert-warning'}`}>
          {mode.inFlow ? 'Still in the normal flow' : 'Removed from the normal flow'}
        </div>
        <p className="small m-0">{mode.text}</p>
        <pre className="demo-output">{css}</pre>
      </div>

      <div className="layout-pg-preview">
        <div className="layout-pos-viewport">
          <div className="layout-pos-scroll">
            <p className="small muted">↓ Scroll inside this box.</p>
            <div className="layout-pos-parent">
              <span className="layout-pos-label">parent · position: relative</span>
              <div className="layout-pos-sibling">Sibling 1</div>
              {/* Only the values that change come from state */}
              <div className="layout-pos-box" style={{ position, top, left }}>
                .box {'{'} position: {position} {'}'}
              </div>
              <div className="layout-pos-sibling">Sibling 2</div>
              <div className="layout-pos-sibling">Sibling 3</div>
              <div className="layout-pos-sibling">Sibling 4</div>
              <div className="layout-pos-sibling">Sibling 5</div>
            </div>
            <p className="small muted">
              End of the parent. A sticky box stops sticking here, because it can never leave its parent.
            </p>
            <div className="layout-pos-filler" />
          </div>
        </div>
      </div>
    </div>
  );
}
