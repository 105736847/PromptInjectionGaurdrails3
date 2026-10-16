import { useEffect, useRef, useState } from 'react';
import { Segmented, Slider } from './Controls.jsx';
import './BoxModel.css';

/**
 * BoxModel – every element is four nested boxes: content → padding → border → margin.
 *
 * `box-sizing` decides what `width` means:
 *   content-box (the CSS default) → width of the CONTENT only; padding + border are added on top
 *   border-box                    → width of the whole BORDER box; the content shrinks to fit
 * This app sets `*, *::before, *::after { box-sizing: border-box }` in index.css,
 * like most modern sites, because it makes sizes much easier to reason about.
 */
const HEIGHT = 60;

// One coloured ring of the DevTools-style diagram.
function Layer({ name, value, children }) {
  return (
    <div className={`layout-bm-layer layout-bm-${name}`}>
      <span className="layout-bm-name">{name}</span>
      <span className="layout-bm-top">{value}</span>
      <span className="layout-bm-left">{value}</span>
      {children}
      <span className="layout-bm-right">{value}</span>
      <span className="layout-bm-bottom">{value}</span>
    </div>
  );
}

export default function BoxModel() {
  const [margin, setMargin] = useState(16);
  const [border, setBorder] = useState(4);
  const [padding, setPadding] = useState(20);
  const [width, setWidth] = useState(200);
  const [boxSizing, setBoxSizing] = useState('content-box');
  const [measured, setMeasured] = useState(0);
  const boxRef = useRef(null);

  // Ask the browser for the real rendered width, to prove the maths below.
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setMeasured(Math.round(entry.borderBoxSize[0].inlineSize)));
    observer.observe(boxRef.current, { box: 'border-box' });
    return () => observer.disconnect();
  }, []);

  // All derived values – calculated during render, not stored in state.
  const extras = 2 * padding + 2 * border;
  const isContentBox = boxSizing === 'content-box';
  const contentWidth = isContentBox ? width : Math.max(0, width - extras);
  const contentHeight = isContentBox ? HEIGHT : Math.max(0, HEIGHT - extras);
  const totalWidth = isContentBox ? width + extras : Math.max(width, extras);

  return (
    <div className="layout-pg">
      <div className="layout-pg-controls">
        <Segmented label="box-sizing" options={['content-box', 'border-box']} value={boxSizing} onChange={setBoxSizing} />
        <Slider label="width" value={width} onChange={setWidth} min={60} max={260} unit="px" />
        <Slider label="padding" value={padding} onChange={setPadding} max={40} unit="px" />
        <Slider label="border" value={border} onChange={setBorder} max={20} unit="px" />
        <Slider label="margin" value={margin} onChange={setMargin} max={40} unit="px" />
      </div>

      <div className="layout-pg-preview layout-bm">
        <Layer name="margin" value={margin}>
          <Layer name="border" value={border}>
            <Layer name="padding" value={padding}>
              <div className="layout-bm-content">
                {contentWidth} × {contentHeight}
              </div>
            </Layer>
          </Layer>
        </Layer>

        <div className="layout-bm-scroll">
          <div className="layout-bm-live">
            <div
              ref={boxRef}
              className="layout-bm-box"
              style={{ width, height: HEIGHT, padding, margin, borderWidth: border, boxSizing }}
            >
              Assignment 3
            </div>
          </div>
        </div>

        <pre className="demo-output">
          {isContentBox
            ? `total width = width + 2×padding + 2×border\n            = ${width} + ${2 * padding} + ${2 * border} = ${totalWidth}px`
            : `total width = width = ${totalWidth}px\ncontent     = ${width} − ${2 * padding} − ${2 * border} = ${contentWidth}px`}
          {`\nspace used incl. margin = ${totalWidth} + ${2 * margin} = ${totalWidth + 2 * margin}px`}
          {`\nmeasured by the browser = ${measured}px ${measured === totalWidth ? '✓' : ''}`}
        </pre>
      </div>
    </div>
  );
}
