/**
 * InteractiveGlobe – where our international students fly in from.
 * Drag to spin the globe, use the arrow keys, or let it rotate by itself.
 *
 * Pattern: D3 owns the <g>
 * A map projection turns [longitude, latitude] into pixels; d3.geoOrthographic
 * draws the earth as seen from space and hides the far side (clipAngle 90).
 * Rotating = changing projection.rotate() and re-running d3.geoPath on every
 * shape. A LineString between two points is drawn as a great circle – the
 * shortest route over the globe.
 *  - set-up effect: projection, layers, d3.drag (re-runs only on resize)
 *  - timer effect:  d3.timer auto-rotation – only while the globe is on screen
 *    (IntersectionObserver), stopped on drag and on unmount
 */
import { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { LocateFixed } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import { motion, prefersReducedMotion } from './helpers/motion.js';
import { countries, land, borders } from './data/world.js';
import { studentsByCountry, origins, MELBOURNE } from './data/internationalStudents.js';

const format = d3.format(',');
const byStudents = [...studentsByCountry.values()].sort((a, b) => b.students - a.students); // for the data table

export default function InteractiveGlobe() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const rotationRef = useRef([-110, 10]); // [λ, φ]: start above South-East Asia
  const renderRef = useRef(() => {}); // the latest "redraw everything" function
  const [autoRotate, setAutoRotate] = useState(() => !prefersReducedMotion());
  const [hover, setHover] = useState(null);
  const gradientId = useId().replace(/[^\w-]/g, '');
  const size = Math.min(width, 520);

  // SET-UP: build the layers once per size; drag rotates the globe.
  useEffect(() => {
    if (size === 0) return undefined;
    const g = d3.select(gRef.current);
    const svg = d3.select(gRef.current.ownerSVGElement);
    const projection = d3.geoOrthographic().scale(size / 2 - 6).translate([size / 2, size / 2]).clipAngle(90);
    const path = d3.geoPath(projection);
    const layer = (name) => g.selectAll(`g.${name}`).data([name]).join('g').attr('class', name);

    // The outline of an orthographic sphere is the same circle at every rotation → draw it once.
    layer('ocean').selectAll('path').data([{ type: 'Sphere' }]).join('path')
      .style('fill', `url(#${gradientId})`).style('stroke', 'var(--chart-axis)').attr('d', path);
    const grid = layer('grid').selectAll('path').data([d3.geoGraticule10()]).join('path')
      .style('fill', 'none').style('stroke', 'var(--chart-grid)');
    // Land must stand out from the sea: a mid-grey fill plus a darker coastline (the "coast" layer).
    const country = layer('countries').selectAll('path').data(countries).join('path')
      .style('fill', (d) => (studentsByCountry.has(d.id) ? 'var(--seq-3)' : 'var(--color-border-strong)'))
      .style('stroke', 'none');
    const border = layer('borders').selectAll('path').data([borders]).join('path')
      .style('fill', 'none').style('stroke', 'var(--color-surface)').style('stroke-width', 0.6).style('pointer-events', 'none');
    const coast = layer('coast').selectAll('path').data([land]).join('path')
      .style('fill', 'none').style('stroke', 'var(--color-text-subtle)').style('stroke-width', 0.75).style('pointer-events', 'none');
    const flights = layer('flights').selectAll('path')
      .data(origins.map((o) => ({ type: 'LineString', coordinates: [o.city, MELBOURNE] })))
      .join('path').attr('class', 'd3-networks-flow') // CSS animates the dashes
      .style('fill', 'none').style('stroke', 'var(--chart-2)').style('stroke-width', 1.8).style('pointer-events', 'none');
    const cities = layer('cities').selectAll('circle').data([...origins.map((o) => o.city), MELBOURNE]).join('circle')
      .attr('r', (d) => (d === MELBOURNE ? 5 : 4))
      .style('fill', 'var(--chart-2)').style('stroke', 'var(--color-surface)').style('stroke-width', 2).style('pointer-events', 'none');
    const label = layer('labels').selectAll('text').data([MELBOURNE]).join('text').text('Melbourne')
      .attr('class', 'viz-label').attr('x', 8).attr('dy', '0.35em').style('font-weight', 600)
      .style('paint-order', 'stroke').style('stroke', 'var(--color-surface)').style('stroke-width', 3).style('pointer-events', 'none');

    function render() {
      projection.rotate(rotationRef.current);
      grid.attr('d', path);
      country.attr('d', path);
      border.attr('d', path);
      coast.attr('d', path);
      flights.attr('d', path);
      // Points on the far side of the globe are hidden: > 90° away from the centre of the view.
      const centre = projection.invert([size / 2, size / 2]);
      const hidden = (d) => (d3.geoDistance(d, centre) > Math.PI / 2 ? 'none' : null);
      cities.attr('transform', (d) => `translate(${projection(d)})`).style('display', hidden);
      label.attr('transform', (d) => `translate(${projection(d)})`).style('display', hidden);
    }
    renderRef.current = render;
    render();

    country.on('pointerenter', function onEnter() { d3.select(this).raise().style('stroke', 'var(--color-text)').style('stroke-width', 1.5); })
      .on('pointermove', (event, d) => {
        const [x, y] = d3.pointer(event, gRef.current.ownerSVGElement);
        setHover({ id: d.id, name: studentsByCountry.get(d.id)?.name ?? d.properties.name, x, y });
      })
      .on('pointerleave', function onLeave() { d3.select(this).style('stroke', 'none'); setHover(null); });

    // d3.drag: every pixel of pointer movement turns the globe by a few tenths of a degree.
    const drag = d3.drag()
      .on('start', () => { setAutoRotate(false); setHover(null); svg.interrupt('spin'); })
      .on('drag', (event) => {
        const k = 75 / projection.scale();
        const [lambda, phi] = rotationRef.current;
        rotationRef.current = [lambda + event.dx * k, Math.max(-90, Math.min(90, phi - event.dy * k))];
        render();
      });
    svg.call(drag).style('cursor', 'grab');

    return () => {
      svg.on('.drag', null).interrupt('spin');
      country.on('pointerenter pointermove pointerleave', null);
    };
  }, [size, gradientId]);

  // AUTO-ROTATE: d3.timer calls us every animation frame until .stop().
  // Redrawing ~200 shapes 60× a second costs real CPU, so we only spin while the globe
  // is actually on screen: pause animations nobody can see.
  useEffect(() => {
    if (!autoRotate || size === 0) return undefined;
    let timer = null;
    const start = () => {
      let last = 0;
      timer = d3.timer((elapsed) => {
        const [lambda, phi] = rotationRef.current;
        rotationRef.current = [lambda + (elapsed - last) * 0.012, phi]; // 12° per second
        last = elapsed;
        renderRef.current();
      });
    };
    const stop = () => { timer?.stop(); timer = null; };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { if (!timer) start(); } else stop();
    });
    observer.observe(gRef.current.ownerSVGElement);
    return () => { observer.disconnect(); stop(); };
  }, [autoRotate, size]);

  // A transition can animate anything with .tween() – here the rotation itself.
  function flyTo(target) {
    setAutoRotate(false);
    d3.select(gRef.current.ownerSVGElement).transition('spin').duration(motion(1200)).tween('rotate', () => {
      const [lambda, phi] = rotationRef.current;
      const turn = ((((target[0] - lambda) % 360) + 540) % 360) - 180; // shortest way round (−180°…180°)
      const r = d3.interpolate([lambda, phi], [lambda + turn, target[1]]);
      return (t) => { rotationRef.current = r(t); renderRef.current(); };
    });
  }

  function handleKeyDown(event) {
    const step = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
    if (!step) return;
    event.preventDefault();
    setAutoRotate(false);
    const [lambda, phi] = rotationRef.current;
    rotationRef.current = [lambda + step[0], Math.max(-90, Math.min(90, phi + step[1]))];
    renderRef.current();
  }

  const info = hover && studentsByCountry.get(hover.id);
  return (
    <figure className="m-0">
      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
          <span className="switch-track" />Auto-rotate
        </label>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => flyTo([-MELBOURNE[0], -MELBOURNE[1]])}>
          <LocateFixed size={15} aria-hidden="true" />Fly to Melbourne
        </button>
        <span className="subtle small">Drag or use the arrow keys to rotate</span>
      </div>
      <ul className="viz-legend">
        <li><span className="viz-swatch" style={{ background: 'var(--seq-3)' }} />Sends students</li>
        <li><span className="viz-key-line" style={{ background: 'var(--chart-2)' }} />Route to Melbourne</li>
      </ul>
      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": the globe is focusable and reacts to keys and drags,
            and role="img" would turn it (and its children) into a flat picture for screen readers */}
        <svg width={width} height={size} tabIndex={0} onKeyDown={handleKeyDown} role="group"
          aria-label="Rotatable globe with flight routes from 12 countries to Melbourne. Use the arrow keys to rotate.">
          <defs>
            {/* A radial gradient makes the ocean look like a sphere lit from the top left */}
            <radialGradient id={gradientId} cx="35%" cy="30%" r="75%">
              <stop offset="0%" style={{ stopColor: 'var(--color-surface)' }} />
              <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--seq-2) 25%, var(--color-surface))' }} />
            </radialGradient>
          </defs>
          <g transform={`translate(${(width - size) / 2},0)`}>
            <g ref={gRef} />
          </g>
        </svg>
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            <div className="viz-tooltip-title">{hover.name}</div>
            <TooltipRow color={info ? 'var(--seq-3)' : 'var(--color-border-strong)'} label="International students"
              value={info ? format(info.students) : 'none'} />
          </ChartTooltip>
        )}
      </div>
      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>International students by country of origin (fictional)</caption>
            <thead><tr><th scope="col">Country</th><th scope="col" className="num">Students</th><th scope="col">Route on the globe</th></tr></thead>
            <tbody>
              {byStudents.map((d) => (
                <tr key={d.name}><th scope="row">{d.name}</th><td className="num">{format(d.students)}</td><td>{d.city ? 'Yes' : '–'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
