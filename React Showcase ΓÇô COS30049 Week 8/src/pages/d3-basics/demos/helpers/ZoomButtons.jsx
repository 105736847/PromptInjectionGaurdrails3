/**
 * ZoomButtons – In / Out / Reset zoom buttons for any d3.zoom behaviour.
 *
 * Keyboard users cannot scroll-wheel or pinch, so every zoomable chart needs
 * buttons too. They call the SAME behaviour the mouse uses (zoom.scaleBy,
 * zoom.transform) on the same element, inside a transition – so the chart's
 * 'zoom' event handler runs for every animation frame, exactly as when scrolling.
 *
 *   <ZoomButtons zoomRef={zoomRef} targetRef={surfaceRef} />
 *   zoomRef   – ref holding the d3.zoom() behaviour
 *   targetRef – ref to the element the behaviour was .call()ed on
 */
import * as d3 from 'd3';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export default function ZoomButtons({ zoomRef, targetRef, step = 1.5 }) {
  function animate(method, value) {
    const ms = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;
    d3.select(targetRef.current).transition().duration(ms).call(zoomRef.current[method], value);
  }

  return (
    <div className="btn-group" role="group" aria-label="Zoom">
      <button type="button" className="btn btn-sm" onClick={() => animate('scaleBy', step)}>
        <ZoomIn size={15} aria-hidden="true" /> In
      </button>
      <button type="button" className="btn btn-sm" onClick={() => animate('scaleBy', 1 / step)}>
        <ZoomOut size={15} aria-hidden="true" /> Out
      </button>
      <button type="button" className="btn btn-sm" onClick={() => animate('transform', d3.zoomIdentity)}>
        <RotateCcw size={15} aria-hidden="true" /> Reset zoom
      </button>
    </div>
  );
}
