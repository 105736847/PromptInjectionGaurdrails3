/**
 * ForceGraph – a unit prerequisite network laid out by a physics simulation.
 *
 * Pattern: D3 owns the <g>
 * React renders the <svg>, the controls and the tooltip; d3-force, d3-drag
 * and d3-zoom own everything inside <g ref={gRef}>.
 *  - one effect SETS UP the simulation, drag and zoom (once),
 *  - one effect UPDATES the forces when a slider moves (re-heats the simulation),
 *  - one effect PAINTS the highlight when React state (hover / search) changes.
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import { UnitSearch, Slider, UnitTooltipContent, PrerequisiteTable } from './helpers/ForceGraphParts.jsx';
import { drawGraph, positionGraph, paintPins, paintHighlight, forceBounds } from './helpers/forceGraphDraw.js';
import { motion } from './helpers/motion.js';
import { zoomFilter, wheelDelta } from './helpers/scrollFriendlyZoom.js';
import { units, prerequisites, prerequisiteChain, YEARS } from './data/prerequisites.js';

const PHYSICS = { charge: -300, distance: 60, collide: 12 }; // slider start values (Reset goes back to them)

export default function ForceGraph() {
  const [wrapRef, { width: measured }] = useElementSize();
  // The Code tab hides the chart (measured width 0). Keep the last real width, so a look at
  // the code doesn't re-run the UPDATE effect and re-heat the simulation (react.dev: "storing
  // information from previous renders").
  const [width, setWidth] = useState(0);
  if (measured > 0 && measured !== width) setWidth(measured);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const simulationRef = useRef(null);
  const zoomRef = useRef(null);
  // Created once: d3-force writes x, y, vx, vy into these objects.
  const [graph] = useState(() => ({
    nodes: units.map((d) => ({ ...d, r: 6 + 2.5 * Math.sqrt(prerequisites.filter((l) => l.source === d.id).length) })),
    links: prerequisites.map((d) => ({ ...d })),
  }));
  const [charge, setCharge] = useState(PHYSICS.charge);
  const [distance, setDistance] = useState(PHYSICS.distance);
  const [collide, setCollide] = useState(PHYSICS.collide);
  const [zoomed, setZoomed] = useState(false); // enables the "Reset zoom" button
  const [hovered, setHovered] = useState(null); // { unit, x, y }
  const [selected, setSelected] = useState(null); // id picked with the search box
  const [query, setQuery] = useState('');
  const [notFound, setNotFound] = useState(false);
  const arrowId = `${useId().replace(/[^\w-]/g, '')}-arrow`; // ids must be unique per instance
  const height = width < 600 ? 440 : 540;

  // 1. SET-UP – runs once. Every D3 object we create is cleaned up again.
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const { link, node } = drawGraph(g, graph, arrowId); // see helpers/forceGraphDraw.js
    paintPins(gRef.current);

    // Tooltip position = top centre of the node, relative to the svg (works for mouse AND keyboard focus).
    const show = (event, d) => {
      const box = event.currentTarget.getBoundingClientRect();
      const origin = svgRef.current.getBoundingClientRect();
      setHovered({ unit: d, x: box.x + box.width / 2 - origin.x, y: box.y - origin.y });
    };
    node.on('pointerenter focus', show).on('pointerleave blur', () => setHovered(null));

    const simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id((d) => d.id))
      .force('charge', d3.forceManyBody())
      .force('collide', d3.forceCollide())
      .force('x', d3.forceX().strength(0.05))
      .force('y', d3.forceY().strength(0.15))
      .on('tick', () => positionGraph(link, node));
    simulationRef.current = simulation;

    // d3.drag: fx/fy FIX a node in place. We keep them after the drag → the node stays pinned.
    // A plain click or tap (no movement) is not a drag, so it must not pin anything.
    let moved = false;
    const drag = d3.drag()
      .on('start', () => { moved = false; })
      .on('drag', (event, d) => {
        if (!moved) { // first movement: now it really is a drag
          moved = true;
          setHovered(null);
          simulation.alphaTarget(0.3).restart(); // keep the simulation warm while we drag
        }
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0); // last finger lifted → let it cool down
        if (moved) paintPins(gRef.current);
      });
    node.call(drag).on('dblclick', (event, d) => {
      d.fx = null; // un-pin: the simulation moves it again
      d.fy = null;
      paintPins(gRef.current);
      simulation.alpha(0.3).restart();
    });

    // d3.zoom: Ctrl/⌘ + wheel, pinch or drag the background. The transform goes on the <g>.
    // The filter leaves a plain wheel / one-finger swipe to the page (helpers/scrollFriendlyZoom.js).
    const zoom = d3.zoom().scaleExtent([0.4, 4]).filter(zoomFilter).wheelDelta(wheelDelta)
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        const { k, x, y } = event.transform;
        setZoomed(k !== 1 || x !== 0 || y !== 0); // same value as before → React skips the re-render
      });
    svg.call(zoom).on('dblclick.zoom', null); // double-click is reserved for un-pinning
    zoomRef.current = zoom;

    return () => {
      simulation.stop();
      svg.on('.zoom', null).interrupt();
      node.on('.drag', null).on('pointerenter focus pointerleave blur dblclick', null);
    };
  }, [graph, arrowId]);

  // 2. UPDATE – slider values (and the chart size) → forces. alpha(…).restart() "re-heats" the simulation.
  useEffect(() => {
    if (width === 0) return;
    const s = Math.min(1, Math.max(0.42, width / 800)); // on a phone, pack the graph tighter
    const simulation = simulationRef.current;
    simulation.force('charge').strength(charge * s);
    simulation.force('link').distance(distance * s);
    simulation.force('collide').radius((d) => d.r + collide * s);
    simulation.force('x').strength(0.06 / s);
    simulation.force('y').y((d) => (d.year - 2) * (height / 3.6)); // year 1 at the top, year 3 at the bottom
    simulation.force('bounds', forceBounds(width, height)); // keep nodes + labels inside the frame
    simulation.alpha(0.7).restart();
  }, [charge, distance, collide, width, height]);

  // 3. HIGHLIGHT – React state (hover or search) → D3 styles.
  const focusId = hovered?.unit.id ?? selected;
  const compact = width > 0 && width < 600; // a phone has no room for 30 labels
  useEffect(() => {
    const chain = focusId ? prerequisiteChain(focusId) : null; // Set of unit ids, or null = nothing highlighted
    paintHighlight(gRef.current, { chain, selected, compact, arrowId }); // see helpers/forceGraphDraw.js
  }, [focusId, selected, compact, arrowId]);

  function handleSearch(event) {
    event.preventDefault();
    const q = query.trim().toLowerCase();
    const node = q && graph.nodes.find((d) => `${d.id} ${d.name}`.toLowerCase().includes(q));
    setNotFound(!node);
    if (!node) return;
    setSelected(node.id);
    // Centre the unit: the viewBox origin is the middle of the svg, so translate by −x, −y.
    d3.select(svgRef.current).transition().duration(motion(750))
      .call(zoomRef.current.transform, d3.zoomIdentity.scale(1.6).translate(-node.x, -node.y));
  }

  // "Reset zoom" only undoes the zoom/pan transform …
  function handleResetZoom() {
    d3.select(svgRef.current).transition().duration(motion(750)).call(zoomRef.current.transform, d3.zoomIdentity);
  }

  // … "Reset" puts the STATE back: no pins, no search, the physics sliders at their start values.
  function handleReset() {
    graph.nodes.forEach((d) => { d.fx = null; d.fy = null; });
    paintPins(gRef.current);
    setSelected(null);
    setQuery('');
    setNotFound(false);
    setCharge(PHYSICS.charge);
    setDistance(PHYSICS.distance);
    setCollide(PHYSICS.collide);
    simulationRef.current.alpha(0.8).restart();
  }

  return (
    <figure className="m-0">
      <div className="viz-controls">
        <UnitSearch query={query} notFound={notFound} onSubmit={handleSearch}
          onQueryChange={(value) => { setQuery(value); setNotFound(false); }} />
        <button type="button" className="btn btn-sm" onClick={handleResetZoom} disabled={!zoomed}>
          <RotateCcw size={15} aria-hidden="true" />Reset zoom
        </button>
        <button type="button" className="btn btn-sm" onClick={handleReset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
        {notFound && <span className="error-text" role="status">No unit matches “{query}”.</span>}
        <span className="subtle small">Drag = pin · double-click = unpin · Ctrl/⌘ + scroll to zoom</span>
      </div>
      <div className="viz-controls">
        <Slider label="Charge" value={charge} onChange={setCharge} min={-600} max={-20} step={10} />
        <Slider label="Link distance" value={distance} onChange={setDistance} min={20} max={160} step={5} />
        <Slider label="Collide radius" value={collide} onChange={setCollide} min={0} max={40} step={1} prefix="r + " />
      </div>
      <ul className="viz-legend">
        {YEARS.map((y) => (
          <li key={y}><span className="viz-swatch d3-networks-dot" style={{ background: `var(--chart-${y})` }} />Year {y}</li>
        ))}
        <li className="small">Circle size = units it directly unlocks</li>
      </ul>

      <div className="viz d3-networks-stage" ref={wrapRef}>
        <svg ref={svgRef} width={width} height={height} viewBox={`${-Math.max(1, width) / 2} ${-height / 2} ${Math.max(1, width)} ${height}`}
          role="group" aria-label="Force-directed graph of 30 units. Arrows point from a prerequisite to the unit it unlocks.">
          <defs>
            {['', '-on'].map((suffix) => (
              <marker key={suffix} id={`${arrowId}${suffix}`} viewBox="0 -5 10 10" refX="10" markerUnits="userSpaceOnUse"
                markerWidth="8" markerHeight="8" orient="auto">
                <path d="M0,-5L10,0L0,5" style={{ fill: suffix ? 'var(--color-text-muted)' : 'var(--chart-axis)' }} />
              </marker>
            ))}
          </defs>
          <g ref={gRef} />
        </svg>
        {hovered && (
          <ChartTooltip x={hovered.x} y={hovered.y} containerWidth={width}>
            <UnitTooltipContent unit={hovered.unit} />
          </ChartTooltip>
        )}
      </div>

      <PrerequisiteTable />
    </figure>
  );
}
