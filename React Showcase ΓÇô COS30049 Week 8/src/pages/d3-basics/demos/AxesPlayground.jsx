/**
 * AxesPlayground – d3-axis and the margin convention.
 * Pattern: mixed – React renders the frame and the data line; D3 owns the three axis <g>s.
 *
 * React renders three EMPTY groups; useEffect calls d3.axisBottom/Top/Left/Right
 * on them. Calling an axis on a TRANSITION (g.transition().call(axis)) animates
 * the ticks to their new positions instead of redrawing them.
 * The code panel below the chart is generated from the same settings: a complete,
 * plain-D3 script that draws exactly this chart.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import CodeBlock from '../../../components/common/CodeBlock.jsx';
import MarginDiagram from './MarginDiagram.jsx';

const HEIGHT = 300;
// Each format preset comes with a domain it makes sense for.
const FORMATS = [
  { spec: ',', label: 'Thousands ,', title: 'Students enrolled', domain: [0, 12500] },
  { spec: '.0%', label: 'Percent .0%', title: 'Pass rate', domain: [0, 1] },
  { spec: '$,.2f', label: 'Currency $,.2f', title: 'Textbook price', domain: [0, 250] },
  { spec: '~s', label: 'SI prefix ~s', title: 'Page views', domain: [0, 2500000] },
  { spec: '.2e', label: 'Exponent .2e', title: 'Learning rate', domain: [0, 0.001] },
];
const SHAPE = [0.18, 0.25, 0.3, 0.42, 0.4, 0.55, 0.62, 0.58, 0.7, 0.78, 0.85, 0.92]; // 12 teaching weeks

export default function AxesPlayground() {
  const id = useId();
  const [sizeRef, { width }] = useElementSize();
  const [margin, setMargin] = useState({ top: 20, right: 30, bottom: 36, left: 80 }); // room for "$250.00" + the axis title
  const [opts, setOpts] = useState({ ticks: 5, format: 1, tickSize: 6, tickPadding: 3, x: 'bottom', y: 'left', grid: true });
  const xRef = useRef(null);
  const yRef = useRef(null);
  const gridRef = useRef(null);

  const fmt = FORMATS[opts.format];
  const innerWidth = Math.max(40, width - margin.left - margin.right);
  const innerHeight = Math.max(40, HEIGHT - margin.top - margin.bottom);
  const xTicks = Math.max(2, Math.min(opts.ticks, Math.floor(innerWidth / 48))); // "Wk 12" needs ≈ 48px, so cap it on phones
  // useMemo keeps the same scale objects between renders, so the effect below only re-runs when they change.
  const x = useMemo(() => d3.scaleLinear().domain([1, 12]).range([0, innerWidth]), [innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain(fmt.domain).range([innerHeight, 0]).nice(), [fmt, innerHeight]); // SVG y grows DOWN → flip the range
  const line = d3.line((d, i) => x(i + 1), (d) => y(d * fmt.domain[1]));

  useEffect(() => {
    if (width === 0) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = d3.transition().duration(600).ease(d3.easeCubicInOut);
    // Animate CHANGES only: the first draw (the <g>s are still empty) and reduced motion use the plain selection.
    const firstDraw = !xRef.current.hasChildNodes();
    const animate = (g) => (firstDraw || reduceMotion ? g : g.transition(t));
    const xAxis = (opts.x === 'bottom' ? d3.axisBottom : d3.axisTop)(x);
    const yAxis = (opts.y === 'left' ? d3.axisLeft : d3.axisRight)(y);

    xAxis.ticks(xTicks).tickFormat((d) => `Wk ${d}`).tickSize(opts.tickSize).tickPadding(opts.tickPadding);
    yAxis.ticks(opts.ticks).tickFormat(d3.format(fmt.spec)).tickSize(opts.tickSize).tickPadding(opts.tickPadding);

    // An axisTop sits at y = 0, an axisBottom at the bottom of the inner area – and so on.
    animate(d3.select(xRef.current)).attr('transform', `translate(0,${opts.x === 'bottom' ? innerHeight : 0})`).call(xAxis);
    // d3-axis sets a label's dy only when the tick is CREATED – fix existing labels after a bottom ⇄ top flip.
    d3.select(xRef.current).selectAll('.tick text').attr('dy', opts.x === 'bottom' ? '0.71em' : '0em');
    animate(d3.select(yRef.current)).attr('transform', `translate(${opts.y === 'left' ? 0 : innerWidth},0)`).call(yAxis);
    // …and sets text-anchor only when the axis is CREATED – fix it after a left ⇄ right flip.
    d3.select(yRef.current).attr('text-anchor', opts.y === 'left' ? 'end' : 'start');
    // Gridlines trick: an axis whose ticks are as long as the chart is wide, with no labels.
    animate(d3.select(gridRef.current))
      .style('opacity', opts.grid ? 1 : 0)
      .call(d3.axisLeft(y).ticks(opts.ticks).tickSize(-innerWidth).tickFormat(''));

    return () => {
      [xRef, yRef, gridRef].forEach((ref) => d3.select(ref.current).selectAll('*').interrupt());
      d3.selectAll([xRef.current, yRef.current, gridRef.current]).interrupt();
    };
  }, [width, x, y, opts, xTicks, fmt.spec, innerWidth, innerHeight]);

  const setOpt = (key, value) => setOpts((o) => ({ ...o, [key]: value }));
  function orient(axis, side) {
    if (opts[axis] === side) return;
    setOpt(axis, side);
    // The axis moves to the other side – so does the margin its labels need.
    setMargin((m) => (axis === 'y' ? { ...m, left: m.right, right: m.left } : { ...m, top: m.bottom, bottom: m.top }));
  }
  // The same chart as a complete, runnable plain-D3 script (every value comes from the live settings).
  const domainMax = fmt.domain[1];
  const xCall = `d3.axis${opts.x === 'bottom' ? 'Bottom' : 'Top'}(x).ticks(${xTicks}).tickFormat((d) => \`Wk \${d}\`)`;
  const yCall = `d3.axis${opts.y === 'left' ? 'Left' : 'Right'}(y).ticks(${opts.ticks}).tickFormat(d3.format('${fmt.spec}'))`;
  const sizes = `.tickSize(${opts.tickSize}).tickPadding(${opts.tickPadding})`;
  const code = `// Needs d3 v7 and an empty <svg id="chart"></svg> on the page.
const width = ${width};   // measured from the container (useElementSize)
const height = ${HEIGHT};
const margin = { top: ${margin.top}, right: ${margin.right}, bottom: ${margin.bottom}, left: ${margin.left} };
const innerWidth = width - margin.left - margin.right;    // ${innerWidth}
const innerHeight = height - margin.top - margin.bottom;  // ${innerHeight}

const svg = d3.select('#chart').attr('width', width).attr('height', height);
const g = svg.append('g').attr('transform', \`translate(\${margin.left},\${margin.top})\`);

// Scales: teaching week → x, value → y (SVG y grows DOWN, so the range is flipped)
const x = d3.scaleLinear().domain([1, 12]).range([0, innerWidth]);
const y = d3.scaleLinear().domain([${fmt.domain.join(', ')}]).range([innerHeight, 0]).nice();
${opts.grid ? `
// Gridlines: an axis whose ticks are as long as the chart is wide, with no labels
g.append('g')
  .call(d3.axisLeft(y).ticks(${opts.ticks}).tickSize(-innerWidth).tickFormat(''))
  .call((grid) => grid.select('.domain').remove())
  .call((grid) => grid.selectAll('line').attr('stroke-opacity', 0.15));
` : ''}
// The data: ${fmt.title.toLowerCase()} over the 12 teaching weeks
const data = [${SHAPE.map((v) => +(v * domainMax).toPrecision(10)).join(', ')}];
g.append('path')
  .attr('fill', 'none')
  .style('stroke', 'var(--chart-1, steelblue)')
  .attr('stroke-width', 2)
  .attr('stroke-linejoin', 'round')
  .attr('d', d3.line((d, i) => x(i + 1), (d) => y(d))(data));

// x axis${xTicks < opts.ticks ? ` – ticks(${opts.ticks}) capped to ${xTicks} so "Wk 12" fits in ${innerWidth}px` : ''}
g.append('g')${opts.x === 'bottom' ? `
  .attr('transform', \`translate(0,\${innerHeight})\`)` : ''}
  .call(${xCall}${sizes});

// y axis
g.append('g')${opts.y === 'right' ? `
  .attr('transform', \`translate(\${innerWidth},0)\`)` : ''}
  .call(${yCall}${sizes});

// y axis title, centred in the ${opts.y} margin
g.append('text')
  .attr('text-anchor', 'middle')
  .attr('font-size', 12)
  .attr('fill', 'currentColor')
  .attr('transform', ${opts.y === 'left'
    ? '`translate(${-margin.left + 14},${innerHeight / 2}) rotate(-90)`'
    : '`translate(${innerWidth + margin.right - 14},${innerHeight / 2}) rotate(90)`'})
  .text('${fmt.title}');`;

  return (
    <div className="stack">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="x axis orientation">
          {['bottom', 'top'].map((o) => (
            <button key={o} type="button" className={`btn btn-sm${opts.x === o ? ' active' : ''}`} aria-pressed={opts.x === o} onClick={() => orient('x', o)}>
              axis{o[0].toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
        <div className="btn-group" role="group" aria-label="y axis orientation">
          {['left', 'right'].map((o) => (
            <button key={o} type="button" className={`btn btn-sm${opts.y === o ? ' active' : ''}`} aria-pressed={opts.y === o} onClick={() => orient('y', o)}>
              axis{o[0].toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
        <label className="switch">
          <input type="checkbox" checked={opts.grid} onChange={(e) => setOpt('grid', e.target.checked)} />
          <span className="switch-track" /> Gridlines
        </label>
      </div>

      <div className="viz-controls d3-basics-axes-controls">
        <div className="field">
          <label className="label" htmlFor={`${id}-fmt`}>tickFormat(d3.format(…))</label>
          <select id={`${id}-fmt`} className="input mono" value={opts.format} onChange={(e) => setOpt('format', Number(e.target.value))}>
            {FORMATS.map((f, i) => <option key={f.spec} value={i}>{f.label}</option>)}
          </select>
        </div>
        {[['ticks', 2, 12], ['tickSize', 0, 12], ['tickPadding', 0, 12]].map(([key, min, max]) => (
          <div className="field" key={key}>
            <label className="label" htmlFor={`${id}-${key}`}>{key}({opts[key]})</label>
            <input id={`${id}-${key}`} type="range" min={min} max={max} value={opts[key]} onChange={(e) => setOpt(key, Number(e.target.value))} />
          </div>
        ))}
        {['top', 'right', 'bottom', 'left'].map((side) => (
          <div className="field" key={side}>
            <label className="label" htmlFor={`${id}-m-${side}`}>margin.{side} = {margin[side]}</label>
            <input id={`${id}-m-${side}`} type="range" min="0" max="100" value={margin[side]}
              onChange={(e) => setMargin({ ...margin, [side]: Number(e.target.value) })} />
          </div>
        ))}
      </div>

      <div className="d3-basics-axes-layout">
        <MarginDiagram width={width || 600} height={HEIGHT} margin={margin} />
        <div ref={sizeRef} className="viz stack-sm">
          {width > 0 && (
            <svg width={width} height={HEIGHT} role="img" aria-label={`${fmt.title} over 12 teaching weeks, formatted with d3.format('${fmt.spec}')`}>
              <rect className="d3-basics-margin-outer" width={width} height={HEIGHT} />
              {/* The margin convention: one translated <g>, then everything inside uses inner coordinates */}
              <g className="d3-basics-inner" style={{ transform: `translate(${margin.left}px, ${margin.top}px)` }}>
                <rect className="d3-basics-margin-inner" width={innerWidth} height={innerHeight} />
                <g ref={gridRef} className="viz-grid" />
                <path className="d3-basics-line d3-basics-line-css" d={line(SHAPE)} />
                <g ref={xRef} className="viz-axis" />
                <g ref={yRef} className="viz-axis" />
                <text className="viz-axis-title" textAnchor="middle"
                  transform={opts.y === 'left' ? `translate(${-margin.left + 14},${innerHeight / 2}) rotate(-90)` : `translate(${innerWidth + margin.right - 14},${innerHeight / 2}) rotate(90)`}>
                  {fmt.title}
                </text>
              </g>
            </svg>
          )}
          <p className="small muted m-0">Labels cut off? That is what the margins are for – an &lt;svg&gt; clips everything outside its box.</p>
        </div>
      </div>

      <div className="d3-basics-snippet">
        <CodeBlock code={code} filename="axes.js (generated from your settings)" />
      </div>
    </div>
  );
}
