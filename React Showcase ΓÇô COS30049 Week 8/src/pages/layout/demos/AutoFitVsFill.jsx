import { useEffect, useRef, useState } from 'react';
import { Slider } from './Controls.jsx';
import './AutoFitVsFill.css';

/**
 * AutoFitVsFill – the famous responsive grid one-liner, in two flavours:
 *
 *   grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
 *   grid-template-columns: repeat(auto-fit,  minmax(110px, 1fr));
 *
 * Both create as many columns as fit. The difference only shows when there
 * are FEWER items than columns: auto-fill keeps the empty tracks, auto-fit
 * collapses them so the items stretch.
 *
 * Empty tracks are invisible, so we measure the grid with a ResizeObserver
 * and draw dashed "ghost" tracks behind the auto-fill grid.
 */
const GAP = 10;

export default function AutoFitVsFill() {
  const [count, setCount] = useState(2);
  const [minWidth, setMinWidth] = useState(110);
  const [widthPercent, setWidthPercent] = useState(100);
  const [gridWidth, setGridWidth] = useState(0);
  const gridRef = useRef(null);

  // Measure the grid whenever ITS size changes (window resize, slider, sidebar...).
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width));
    observer.observe(gridRef.current);
    return () => observer.disconnect(); // cleanup: stop observing on unmount
  }, []);

  // The same maths the browser uses: how many min-width tracks (+ gaps) fit?
  const trackCount = Math.max(1, Math.floor((gridWidth + GAP) / (minWidth + GAP)));
  const emptyTracks = Math.max(0, trackCount - count);
  const template = (keyword) => `repeat(${keyword}, minmax(${minWidth}px, 1fr))`;

  const items = Array.from({ length: count }, (_, i) => (
    <div key={i} className="layout-item layout-fit-item" style={{ '--item-color': `var(--chart-${(i % 6) + 1})` }}>
      {i + 1}
    </div>
  ));

  return (
    <div className="stack">
      <div className="grid-3">
        <Slider label="items" value={count} onChange={setCount} min={1} max={8} />
        <Slider label="minmax() minimum" value={minWidth} onChange={setMinWidth} min={60} max={200} step={10} unit="px" />
        <Slider label="container width" value={widthPercent} onChange={setWidthPercent} min={40} max={100} unit="%" />
      </div>

      <div className="stack" style={{ width: `${widthPercent}%` }}>
        <figure className="layout-fit-figure">
          <figcaption>
            <code>{template('auto-fill')}</code>
            <span className="badge badge-warning">{emptyTracks} empty track{emptyTracks === 1 ? '' : 's'} kept</span>
          </figcaption>
          <div className="layout-fit-frame">
            {/* Ghost tracks: one dashed box per column the browser created */}
            {emptyTracks > 0 && (
              <div className="layout-fit-ghosts" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${trackCount}, 1fr)` }}>
                {Array.from({ length: trackCount }, (_, i) => (
                  <span key={i}>{i >= count ? 'empty' : ''}</span>
                ))}
              </div>
            )}
            <div ref={gridRef} className="layout-fit-grid" style={{ gridTemplateColumns: template('auto-fill') }}>
              {items}
            </div>
          </div>
        </figure>

        <figure className="layout-fit-figure">
          <figcaption>
            <code>{template('auto-fit')}</code>
            <span className="badge badge-success">{emptyTracks} empty track{emptyTracks === 1 ? '' : 's'} collapsed</span>
          </figcaption>
          <div className="layout-fit-frame">
            <div className="layout-fit-grid" style={{ gridTemplateColumns: template('auto-fit') }}>
              {items}
            </div>
          </div>
        </figure>
      </div>

      <p className="hint">
        Room for <strong>{trackCount}</strong> column{trackCount === 1 ? '' : 's'} of at least {minWidth}px in{' '}
        {Math.round(gridWidth)}px. Add items until they fill a row – then both grids look identical.
      </p>
    </div>
  );
}
