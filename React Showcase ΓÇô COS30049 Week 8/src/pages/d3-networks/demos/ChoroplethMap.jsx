/**
 * ChoroplethMap – international students by country, shaded in 7 bins.
 * Click a country (or a table row) to fly to it; Ctrl/⌘ + scroll or pinch to zoom, drag to pan.
 *
 * Pattern: mixed
 * React draws every country; the D3 behaviour d3.zoom listens on the <svg> and puts its transform in React state.
 *
 * d3.geoEqualEarth (an equal-area projection, so countries far from the equator
 * are not drawn bigger than they are – unlike Mercator) + d3.geoPath compute the
 * outlines once; React draws them.
 * For simplicity we map raw counts; a fairer map would show a rate (see the exercises).
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RotateCcw } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { motion } from './helpers/motion.js';
import { zoomFilter, wheelDelta } from './helpers/scrollFriendlyZoom.js';
import { countries } from './data/world.js';
import { studentsByCountry } from './data/internationalStudents.js';

const format = d3.format(',');
const THRESHOLDS = [100, 200, 400, 800, 1600, 3200]; // 6 thresholds → 7 bins
// A threshold scale maps a number to a bin; each bin gets one step of the sequential ramp.
const color = d3.scaleThreshold().domain(THRESHOLDS).range(d3.range(1, 8).map((i) => `var(--seq-${i})`));
const binLabels = ['< 100', ...THRESHOLDS.map((t, i) => (THRESHOLDS[i + 1] ? `${format(t)}–${format(THRESHOLDS[i + 1] - 1)}` : `${format(t)}+`))];
const mapCountries = countries.filter((f) => f.properties.name !== 'Antarctica');
const total = d3.sum([...studentsByCountry.values()], (d) => d.students);
const top = [...studentsByCountry.entries()].sort((a, b) => b[1].students - a[1].students).slice(0, 8);
const keyOf = (f) => f.id ?? f.properties.name; // 3 countries (e.g. Kosovo) have no ISO id in world-atlas

export default function ChoroplethMap() {
  const [wrapRef, { width: measured }] = useElementSize();
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const hatchId = useId().replace(/[^\w-]/g, '');
  const [transform, setTransform] = useState(() => d3.zoomIdentity);
  const [selected, setSelected] = useState(null); // keyOf() the country we zoomed to
  const [hover, setHover] = useState(null);
  // The DemoCard "Code" tab hides the map (measured width 0). Keep the last real width, so a
  // look at the code doesn't reset the zoom. Updating state during render like this is the
  // react.dev pattern for "storing information from previous renders".
  const [width, setWidth] = useState(0);
  if (measured > 0 && measured !== width) {
    setWidth(measured);
    setSelected(null); // a real resize starts again from the whole world (see the zoom effect)
  }
  const height = Math.round(width * 0.5);

  // D3 calculates: fit the projection to the box, then pre-compute every outline.
  const { path, shapes } = useMemo(() => {
    const projection = d3.geoEqualEarth().fitSize([width, height], { type: 'FeatureCollection', features: mapCountries });
    const geoPath = d3.geoPath(projection);
    return { path: geoPath, shapes: width ? mapCountries.map((f) => ({ f, d: geoPath(f), info: studentsByCountry.get(f.id) })) : [] };
  }, [width, height]);

  // d3.zoom: wheel / pinch / drag produce a transform {x, y, k}; we keep it in React state.
  useEffect(() => {
    if (width === 0) return undefined;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([1, 12]).translateExtent([[0, 0], [width, height]])
      .filter(zoomFilter).wheelDelta(wheelDelta) // a plain scroll still scrolls the page
      .on('zoom', (event) => setTransform(event.transform));
    svg.call(zoom).call(zoom.transform, d3.zoomIdentity); // new size → start from the whole world
    zoomRef.current = zoom;
    return () => svg.on('.zoom', null).interrupt();
  }, [width, height]);

  function zoomTo(feature) {
    const svg = d3.select(svgRef.current).transition().duration(motion(750));
    if (!feature || keyOf(feature) === selected) { // second click = zoom back out
      setSelected(null);
      svg.call(zoomRef.current.transform, d3.zoomIdentity);
      return;
    }
    const [[x0, y0], [x1, y1]] = path.bounds(feature); // the country's bounding box in pixels
    const k = Math.min(12, 0.8 / Math.max((x1 - x0) / width, (y1 - y0) / height));
    setSelected(keyOf(feature));
    svg.call(zoomRef.current.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
  }

  const outlined = shapes.filter((s) => keyOf(s.f) === selected || s.f === hover?.f);
  const noData = `url(#${hatchId})`;
  return (
    <figure className="m-0">
      <div className="viz-controls">
        <button type="button" className="btn btn-sm" onClick={() => zoomTo(null)} disabled={transform.k === 1 && !selected}>
          <RotateCcw size={15} aria-hidden="true" />Reset zoom
        </button>
        <span className="subtle small">Click a country · Ctrl/⌘ + scroll to zoom · drag (two fingers on touch) to pan</span>
      </div>
      <ul className="viz-legend">
        <li className="small">International students:</li>
        {binLabels.map((label, i) => <li key={label}><span className="viz-swatch" style={{ background: `var(--seq-${i + 1})` }} />{label}</li>)}
        <li><span className="viz-swatch d3-networks-hatch" />No data</li>
      </ul>
      <div className="viz d3-networks-stage" ref={wrapRef}>
        {/* role="group", not "img": the countries are clickable and the map pans/zooms –
            role="img" is only for purely static graphics */}
        <svg ref={svgRef} width={width} height={height} role="group" style={{ cursor: 'grab' }}
          aria-label="World map of international students by country of origin. The table below lists the top countries.">
          <defs>
            {/* "No data" must look different in KIND from the lightest bin, not just a bit greyer:
                a hatched fill. scale(1 / k) undoes the zoom, so the stripes keep their spacing. */}
            <pattern id={hatchId} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform={`scale(${1 / transform.k}) rotate(45)`}>
              <rect width={5} height={5} style={{ fill: 'var(--color-surface-2)' }} />
              <line y2={5} style={{ stroke: 'var(--color-border-strong)', strokeWidth: 2 }} />
            </pattern>
          </defs>
          <g transform={transform.toString()}>
            {shapes.map(({ f, d, info }) => (
              <path key={keyOf(f)} d={d} vectorEffect="non-scaling-stroke"
                style={{ fill: info ? color(info.students) : noData, stroke: 'var(--color-surface)', strokeWidth: 0.5, cursor: 'pointer' }}
                onPointerMove={(e) => { const [x, y] = d3.pointer(e, svgRef.current); setHover({ f, info, x, y }); }}
                onPointerLeave={() => setHover(null)}
                onClick={() => zoomTo(f)} />
            ))}
            {/* outlines on top so neighbours can't cover them: a wide surface-coloured halo + a thin ink line */}
            {outlined.map(({ f, d }) => ['var(--color-surface)', 'var(--color-text)'].map((stroke, i) => (
              <path key={`outline-${keyOf(f)}-${i}`} d={d} vectorEffect="non-scaling-stroke"
                style={{ fill: 'none', stroke, strokeWidth: i === 0 ? 4 : 1.5, pointerEvents: 'none' }} />
            )))}
          </g>
        </svg>
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            <div className="viz-tooltip-title">{hover.info?.name ?? hover.f.properties.name}</div>
            {hover.info ? (
              <>
                <TooltipRow color={color(hover.info.students)} label="International students" value={format(hover.info.students)} />
                <TooltipRow label="Share of all" value={d3.format('.1%')(hover.info.students / total)} />
              </>
            ) : <TooltipRow keyClass="d3-networks-hatch" label="International students" value="No data" />}
          </ChartTooltip>
        )}
      </div>

      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table d3-networks-compact-table">
            <caption>Top {top.length} countries – click one to fly to it</caption>
            <thead><tr><th scope="col">#</th><th scope="col">Country</th><th scope="col" className="num">Students</th><th scope="col" className="num">Share</th></tr></thead>
            <tbody>
              {top.map(([id, d], i) => (
                <tr key={id} style={selected === id ? { background: 'var(--color-primary-soft)' } : undefined}>
                  <td>{i + 1}</td>
                  <th scope="row">
                    <button type="button" className="d3-networks-link-button" onClick={() => zoomTo(mapCountries.find((f) => f.id === id))}>
                      <span className="viz-swatch" style={{ background: color(d.students) }} />{d.name}
                    </button>
                  </th>
                  <td className="num">{format(d.students)}</td>
                  <td className="num">{d3.format('.1%')(d.students / total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
