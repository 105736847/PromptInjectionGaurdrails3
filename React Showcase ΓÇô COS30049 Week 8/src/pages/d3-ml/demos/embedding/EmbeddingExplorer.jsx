/**
 * EmbeddingExplorer – 1,000 test URLs in a 2-D projection of the model's
 * embedding (think t-SNE / UMAP). Mistakes (×) sit where the clusters meet.
 *
 * Pattern: D3 owns the <g>
 * One effect SETS UP the long-lived behaviours (d3.zoom, d3.brush, a
 * d3.Delaunay index for hover) – they share the current zoom transform through
 * a closure variable, and a ref remembers it when the setup has to run again
 * (resize, or the Code tab hid the chart). A second effect only restyles the
 * selection, so selecting never resets the zoom. React owns the controls,
 * tooltip and the tables. Ctrl/⌘ + wheel zooms – a plain wheel scrolls the page.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Minus, Plus, RotateCcw, SquareDashedMousePointer, Move } from 'lucide-react';
import useElementSize from '../../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from '../helpers/ChartTooltip.jsx';
import { CLUSTERS, testSet } from '../data/phishingData.js';
import { motion, pct } from '../helpers/chart.js';
import { wheelDelta, zoomFilter } from '../helpers/scrollFriendlyZoom.js';
import { placeClusterLabels } from './clusterLabels.js';
import SelectionTable from './SelectionTable.jsx';
import ClusterSummary from './ClusterSummary.jsx';

const POINTS = testSet.map((d) => ({ ...d, wrong: (d.score >= 0.5 ? 1 : 0) !== d.label }));
const COLOR = ['var(--chart-1)', 'var(--chart-2)']; // legitimate, phishing
const circle = d3.symbol(d3.symbolCircle, 48)();
const cross = d3.symbol(d3.symbolTimes, 70)();

export default function EmbeddingExplorer() {
  const [ref, { width }] = useElementSize();
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const brushRef = useRef(null);
  const zoomRef = useRef(null); // the d3.zoom behaviour (for the buttons)
  const viewRef = useRef(null); // { transform, width, height } – the last zoom, kept across re-setups
  const [mode, setMode] = useState('zoom'); // 'zoom' | 'brush'
  const [hover, setHover] = useState(null); // { d, sx, sy }
  const [selected, setSelected] = useState(() => new Set());

  // The embedding is 160 × 100 units: keep roughly that aspect ratio so clusters are not squashed.
  const height = Math.round(Math.min(520, Math.max(300, width / 1.6)));
  const x = useMemo(() => d3.scaleLinear([0, 160], [12, width - 12]), [width]);
  const y = useMemo(() => d3.scaleLinear([0, 100], [height - 12, 12]), [height]);
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, ''); // unique, url()-safe id

  // SETUP effect: draw points + create zoom, brush and the Delaunay index.
  useEffect(() => {
    if (width === 0) return undefined;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    let transform = d3.zoomIdentity;
    // Zooming moves the POINTS (not the whole group), so symbols keep their size.
    const place = (sel) => sel.attr('transform', (d) => `translate(${transform.apply([x(d.x), y(d.y)])})`);
    // Cluster names: full, shortened or hidden – whatever avoids a collision (see clusterLabels.js).
    const placeLabels = (sel) => placeClusterLabels(sel, ([cx, cy]) => transform.apply([x(cx), y(cy)]), [width, height]);

    const marks = g.selectAll('path.d3ml-emb-point').data(POINTS, (d) => d.id)
      .join('path')
      .attr('class', (d) => `d3ml-emb-point ${d.wrong ? 'is-wrong' : ''}`)
      .attr('d', (d) => (d.wrong ? cross : circle))
      .style('fill', (d) => (d.wrong ? 'none' : COLOR[d.label]))
      .style('stroke', (d) => (d.wrong ? COLOR[d.label] : null))
      .call(place);
    const labels = g.selectAll('text.d3ml-emb-label').data(CLUSTERS, (c) => c.name).join('text')
      .attr('class', 'viz-label d3ml-emb-label').attr('text-anchor', 'middle')
      .call(placeLabels);

    // Delaunay.find walks the triangulation to the point nearest (px, py) – far faster than
    // checking all 1,000 points on every mouse move, and a forgiving hover target.
    const delaunay = d3.Delaunay.from(POINTS, (d) => x(d.x), (d) => y(d.y));
    // Mouse: follows the pointer. Touch: a tap (click) picks a point – or clears the tooltip when
    // no point is near – and since a finger "leaves" as it lifts, only a MOUSE leaving hides it.
    svg.on('pointermove.hover click.hover', (event) => {
      const [bx, by] = transform.invert(d3.pointer(event)); // screen → un-zoomed pixels
      const d = POINTS[delaunay.find(bx, by)];
      const [sx, sy] = transform.apply([x(d.x), y(d.y)]);
      const [px, py] = d3.pointer(event);
      setHover(Math.hypot(sx - px, sy - py) < 28 ? { d, sx, sy } : null);
    }).on('pointerleave.hover', (event) => event.pointerType !== 'touch' && setHover(null));

    const zoom = d3.zoom().scaleExtent([1, 12])
      .extent([[0, 0], [width, height]]).translateExtent([[0, 0], [width, height]])
      // zoomFilter: Ctrl/⌘ + wheel (or a pinch) zooms, a plain wheel scrolls the page, two fingers pan.
      // And: d3.brush lets its mousedown bubble up to the <svg> – without the second check the
      // zoom would ALSO start a pan under every brush drag (and keep panning afterwards).
      .filter((event) => zoomFilter(event) && (event.type === 'wheel' || !brushRef.current?.contains(event.target)))
      .wheelDelta(wheelDelta)
      .on('zoom', (event) => {
        transform = event.transform; // remember it for hover + brush maths…
        viewRef.current = { transform, width, height }; // …and for the next setup
        marks.call(place);
        labels.call(placeLabels);
        setHover(null);
      });
    svg.call(zoom).on('dblclick.zoom', null);
    zoomRef.current = zoom;
    // Restore the previous view. After a resize, scale the pan offset to the new size.
    const view = viewRef.current;
    if (view) {
      const t = view.transform;
      svg.call(zoom.transform, d3.zoomIdentity.translate(t.x * (width / view.width), t.y * (height / view.height)).scale(t.k));
    }

    // Brush: select a rectangle ON SCREEN, then keep the ids (so zooming keeps the selection).
    const brush = d3.brush().extent([[0, 0], [width, height]]).on('end', (event) => {
      if (!event.selection) return; // fired again by brush.move(null) below
      const [[x0, y0], [x1, y1]] = event.selection;
      const inside = POINTS.filter((d) => {
        const [sx, sy] = transform.apply([x(d.x), y(d.y)]);
        return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1;
      });
      setSelected(new Set(inside.map((d) => d.id)));
      d3.select(brushRef.current).call(brush.move, null); // hide the rectangle
    });
    const brushG = d3.select(brushRef.current).call(brush);

    return () => {
      // Remove the listeners; the next setup restores the zoom from viewRef.
      svg.on('.zoom', null).on('.hover', null);
      brushG.on('.brush', null).selectAll('*').remove();
      svg.interrupt().selectAll('*').interrupt(); // incl. a running zoom-button transition
    };
  }, [width, height, x, y]);

  // UPDATE effect: dim everything outside the selection (no re-setup needed).
  useEffect(() => {
    d3.select(gRef.current).selectAll('path.d3ml-emb-point')
      .classed('is-dim', (d) => selected.size > 0 && !selected.has(d.id));
  }, [selected, width]);

  // Buttons drive the SAME zoom behaviour (keyboard users can zoom too).
  const zoomBy = (k) => svgRef.current && d3.select(svgRef.current).transition().duration(motion(400)).call(zoomRef.current.scaleBy, k);
  const resetZoom = () => svgRef.current && d3.select(svgRef.current).transition().duration(motion(600)).call(zoomRef.current.transform, d3.zoomIdentity);
  const selectedRows = POINTS.filter((d) => selected.has(d.id));

  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Mouse mode">
          <button type="button" className={`btn btn-sm ${mode === 'zoom' ? 'active' : ''}`} aria-pressed={mode === 'zoom'} onClick={() => setMode('zoom')}>
            <Move size={14} /> Pan &amp; zoom
          </button>
          <button type="button" className={`btn btn-sm ${mode === 'brush' ? 'active' : ''}`} aria-pressed={mode === 'brush'} onClick={() => setMode('brush')}>
            <SquareDashedMousePointer size={14} /> Brush to select
          </button>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn-sm btn-icon" aria-label="Zoom in" onClick={() => zoomBy(1.6)}><Plus size={16} /></button>
          <button type="button" className="btn btn-sm btn-icon" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.6)}><Minus size={16} /></button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={resetZoom}><RotateCcw size={14} /> Reset zoom</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set(POINTS.filter((d) => d.wrong).map((d) => d.id)))}>
            Select all mistakes
          </button>
        </div>
      </div>
      <ul className="viz-legend">
        <li><span className="viz-swatch" style={{ background: COLOR[0], borderRadius: '50%' }} /> Legitimate</li>
        <li><span className="viz-swatch" style={{ background: COLOR[1], borderRadius: '50%' }} /> Phishing</li>
        <li><strong aria-hidden="true">×</strong> misclassified at threshold 0.5 (colour = true class)</li>
      </ul>

      <div className="viz" ref={ref}>
        {width > 0 && (
          <svg ref={svgRef} width={width} height={height} className={`d3ml-emb is-${mode}`} role="group"
            aria-label={`Scatter plot of ${POINTS.length} URLs in the model's embedding, coloured by true class. ${selected.size} selected.`}>
            <defs><clipPath id={clipId}><rect width={width} height={height} /></clipPath></defs>
            <rect className="d3ml-frame" width={width} height={height} />
            <g clipPath={`url(#${clipId})`}><g ref={gRef} /></g>
            {hover && <circle className="d3ml-ghost" cx={hover.sx} cy={hover.sy} r={9} />}
            <g className={mode === 'brush' ? undefined : 'd3ml-hidden'}><g ref={brushRef} /></g>
          </svg>
        )}
        {hover && (
          <ChartTooltip x={hover.sx} y={hover.sy} width={width} title={hover.d.cluster}>
            <div className="mono small d3ml-tooltip-url">{hover.d.url}</div>
            <TooltipRow color={COLOR[hover.d.label]} label="True class" value={hover.d.label ? 'Phishing' : 'Legitimate'} />
            <TooltipRow color="transparent" label="Phishing score" value={pct(hover.d.score)} />
            <TooltipRow color="transparent" label="At threshold 0.5" value={hover.d.wrong ? 'misclassified' : 'correct'} />
          </ChartTooltip>
        )}
      </div>
      <p className="small muted m-0">
        Ctrl/⌘ + scroll to zoom · drag to pan · on a phone, pinch and pan with two fingers.
      </p>

      <SelectionTable rows={selectedRows} onClear={() => setSelected(new Set())} colors={COLOR} />
      <ClusterSummary colors={COLOR} />
    </div>
  );
}
