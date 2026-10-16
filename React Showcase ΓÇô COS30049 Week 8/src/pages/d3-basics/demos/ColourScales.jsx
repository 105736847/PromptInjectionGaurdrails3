/**
 * ColourScales – colour scales done right.
 * Pattern: D3 calculates, React renders.
 *
 * d3.scaleSequential / d3.scaleDiverging map a number to a colour through an
 * INTERPOLATOR: a function from t ∈ [0, 1] to a colour. d3-scale-chromatic
 * ships many (interpolateBlues, interpolateViridis…); our own tokens become
 * interpolators with d3.interpolateRgbBasis / d3.piecewise. useChartTheme()
 * hands D3 the token colours as real values, and updates them when the theme changes.
 * Try the "vision" menu to see the heatmap through colour-blind eyes.
 * Hover: one transparent layer over the whole heatmap turns the pointer position
 * into a row and column, so even 20px cells on a phone are easy to hit.
 */
import { useId, useState } from 'react';
import * as d3 from 'd3';
import { TriangleAlert } from 'lucide-react';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useElementSize from '../../../hooks/useElementSize.js';
import VisionFilters, { VISIONS } from './helpers/VisionFilters.jsx';
import { cells, DAYS, WEEKS, MEAN } from './data/lmsActivity.js';

const SCHEMES = [
  { id: 'ours-seq', label: 'Our sequential tokens', kind: 'sequential', verdict: 'good', interp: (c) => d3.interpolateRgbBasis(c.sequential),
    note: 'One hue: more = more contrast with the background – darker in light mode, lighter in dark mode. Dark mode has its own validated steps, so low values sink into the background.' },
  { id: 'blues', label: 'd3.interpolateBlues', kind: 'sequential', verdict: 'ok', interp: () => d3.interpolateBlues,
    note: 'Also one hue – but designed for white paper. Switch to dark mode: the LOW values now glow brightest.' },
  { id: 'viridis', label: 'd3.interpolateViridis', kind: 'sequential', verdict: 'ok', interp: () => d3.interpolateViridis,
    note: 'Perceptually uniform and colour-blind safe. Uses several hues, so it looks busier than a single-hue ramp.' },
  { id: 'cividis', label: 'd3.interpolateCividis', kind: 'sequential', verdict: 'ok', interp: () => d3.interpolateCividis,
    note: 'Optimised to look almost the same with red–green colour-vision deficiency.' },
  { id: 'ours-div', label: 'Our diverging tokens', kind: 'diverging', verdict: 'good', interp: (c) => d3.piecewise(d3.interpolateLab, c.diverging),
    note: 'Polarity: blue = below the semester average, red = above, neutral grey = average. Two hues, never a third.' },
  { id: 'rdbu', label: 'd3.interpolateRdBu', kind: 'diverging', verdict: 'ok', interp: () => (t) => d3.interpolateRdBu(1 - t),
    note: 'A classic diverging scheme (flipped so blue = below). Its white midpoint glows on a dark background.' },
  { id: 'rainbow', label: 'd3.interpolateRainbow', kind: 'sequential', verdict: 'bad', interp: () => d3.interpolateRainbow,
    note: 'Don’t do this: hues have no natural order, bright bands invent edges that are not in the data, and it starts and ends on the same colour.' },
];
const VERDICT = { good: ['badge-success', 'Validated tokens'], ok: ['badge-info', 'Use with care'], bad: ['badge-danger', 'Don’t do this'] };
const CATEGORICAL = ['blue', 'orange', 'aqua', 'yellow', 'magenta', 'green', 'violet', 'red'];
const LABEL_W = 38;
const HEADER_H = 22;
const gradient = (interp) => `linear-gradient(90deg, ${d3.quantize(interp, 12).join(', ')})`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function ColourScales() {
  const colors = useChartTheme(); // real colour values for the current theme
  const id = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [schemeId, setSchemeId] = useState('ours-seq');
  const [vision, setVision] = useState('normal');
  const [probe, setProbe] = useState(null); // value picked with the slider
  const [hover, setHover] = useState(null);
  const [sizeRef, { width }] = useElementSize();

  const scheme = SCHEMES.find((s) => s.id === schemeId);
  const diverging = scheme.kind === 'diverging';
  const valueOf = (d) => (diverging ? d.diff : d.value);
  const maxAbs = d3.max(cells, (d) => Math.abs(d.diff));
  const [lo, hi] = diverging ? [-maxAbs, maxAbs] : d3.extent(cells, valueOf);
  // The colour scale: value → colour. Diverging scales take [min, MIDPOINT, max].
  const color = diverging
    ? d3.scaleDiverging(scheme.interp(colors)).domain([lo, 0, hi])
    : d3.scaleSequential(scheme.interp(colors)).domain([lo, hi]);
  const probeValue = probe === null || probe < lo || probe > hi ? +((lo + hi) / 2).toFixed(1) : probe;

  const size = Math.max(14, Math.min(44, Math.floor((width - LABEL_W) / WEEKS.length)));
  const svgWidth = LABEL_W + size * WEEKS.length;
  const legendX = d3.scaleLinear().domain([lo, hi]).range([LABEL_W, svgWidth]);
  const heatHeight = HEADER_H + size * DAYS.length;
  const fmt = (v) => (diverging ? d3.format('+.1f')(v) : d3.format('.1f')(v));

  // Nearest cell: pointer position → column (week) and row (day), clamped to the grid.
  function pickCell(event) {
    const [px, py] = d3.pointer(event.nativeEvent, event.currentTarget);
    const col = clamp(Math.floor((px - LABEL_W) / size), 0, WEEKS.length - 1);
    const row = clamp(Math.floor((py - HEADER_H) / size), 0, DAYS.length - 1);
    const d = cells[col * DAYS.length + row]; // cells are stored week by week, 7 days each
    setHover({ d, x: LABEL_W + col * size + size / 2, y: HEADER_H + row * size });
  }

  // One scheme button – used for the six usable schemes and for the anti-example.
  const schemeButton = (s) => (
    <button key={s.id} type="button" className="d3-basics-scheme" aria-pressed={s.id === schemeId} onClick={() => setSchemeId(s.id)}>
      <span className="d3-basics-ramp" style={{ background: gradient(s.interp(colors)) }} />
      {/* \u200b = an invisible line-break opportunity after "interpolate" */}
      <span className="mono">{s.label.replace('interpolate', 'interpolate\u200b')}</span>
      <span className={`badge ${VERDICT[s.verdict][0]}`}>{VERDICT[s.verdict][1]}</span>
    </button>
  );

  return (
    <div className="stack">
      <VisionFilters prefix={id} />
      <div className="viz-controls">
        <label className="d3-basics-inline-select">
          Vision
          <select className="input" value={vision} onChange={(e) => setVision(e.target.value)}>
            {VISIONS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
      </div>

      {/* Everything inside is seen "through" the selected vision filter */}
      <div className="stack" style={{ filter: vision === 'normal' ? undefined : `url(#${id}-${vision})` }}>
        <div className="d3-basics-picker stack-sm">
          <div className="d3-basics-schemes" role="group" aria-label="Colour schemes you can use">
            {SCHEMES.filter((s) => s.verdict !== 'bad').map(schemeButton)}
          </div>
          <div className="d3-basics-anti" role="group" aria-labelledby={`${id}-anti`}>
            <p id={`${id}-anti`} className="small m-0">
              <TriangleAlert size={15} aria-hidden="true" /> <strong>Anti-example</strong> – for comparison only, never ship it:
            </p>
            {SCHEMES.filter((s) => s.verdict === 'bad').map(schemeButton)}
          </div>
        </div>
        <p className={scheme.verdict === 'bad' ? 'alert alert-danger small m-0' : 'muted small m-0'}>{scheme.note}</p>

        <div className="d3-basics-probe-row">
          <label className="d3-basics-inline-range">
            Pick a value
            <input type="range" min={lo} max={hi} step="0.1" value={probeValue} onChange={(e) => setProbe(Number(e.target.value))} />
          </label>
          <span className="d3-basics-chip" style={{ background: color(probeValue) }} aria-hidden="true" />
          <code>color({fmt(probeValue)}) → &quot;{d3.color(color(probeValue)).formatHex()}&quot;</code>
        </div>

        <figure ref={sizeRef} className="m-0 stack-sm">
          <figcaption className="small">
            <strong>{diverging ? `Logins vs the semester average (${MEAN})` : 'Average logins per student'}</strong>{' '}
            <span className="muted">by weekday and teaching week (fictional)</span>
          </figcaption>

          {/* Legend: the colour ramp with an axis; the triangle marks the picked value */}
          {width > 0 && (
            <div className="viz-legend m-0">
              <svg width={svgWidth} height={40} aria-hidden="true" className="d3-basics-legend">
                <defs>
                  <linearGradient id={`${id}-legend`}>
                    {d3.quantize((t) => color(lo + t * (hi - lo)), 16).map((c, i) => (
                      <stop key={i} offset={`${(i / 15) * 100}%`} style={{ stopColor: c }} />
                    ))}
                  </linearGradient>
                </defs>
                <rect x={LABEL_W} y={4} width={svgWidth - LABEL_W} height={12} rx={3} style={{ fill: `url(#${id}-legend)` }} />
                {legendX.ticks(5).map((t) => (
                  <text key={t} className="viz-tick" x={legendX(t)} y={32} textAnchor="middle">{fmt(t)}</text>
                ))}
                <path className="d3-basics-probe" d={`M${legendX(probeValue)},18l-5,-8h10z`} transform="translate(0,-2)" />
              </svg>
            </div>
          )}

          <div className="viz">
            {width > 0 && (
              // role="group", not "img": the cells respond to the pointer (the table below has every value)
              <svg width={svgWidth} height={heatHeight} role="group"
                aria-label="Heatmap of LMS logins per weekday and week; peaks in weeks 6, 11 and 12">
                {WEEKS.map((w, i) => (
                  <text key={w} className="viz-tick" x={LABEL_W + i * size + size / 2} y={HEADER_H - 8} textAnchor="middle">
                    {size < 30 && w % 2 === 0 ? '' : `W${w}`}
                  </text>
                ))}
                {DAYS.map((day, j) => (
                  <text key={day} className="viz-tick" x={0} y={HEADER_H + j * size + size / 2} dy="0.32em">{day}</text>
                ))}
                {cells.map((d) => (
                  <rect key={`${d.week}-${d.day}`} x={LABEL_W + (d.week - 1) * size + 1} y={HEADER_H + DAYS.indexOf(d.day) * size + 1}
                    width={size - 2} height={size - 2} rx={3}
                    className={hover?.d === d ? 'd3-basics-cell is-hovered' : 'd3-basics-cell'} style={{ fill: color(valueOf(d)) }} />
                ))}
                {/* Hit layer on top of everything: a tap or hover anywhere picks the nearest cell.
                    A tapped cell keeps its tooltip after the finger lifts (touch fires pointerleave then). */}
                <rect className="d3-basics-hit" width={svgWidth} height={heatHeight}
                  onPointerMove={pickCell} onPointerDown={pickCell} onPointerLeave={(e) => e.pointerType !== 'touch' && setHover(null)} />
              </svg>
            )}
            {hover && (
              // Near an edge, anchor the tooltip on its side instead of centring it, so it stays inside the card.
              <div className={`viz-tooltip d3-basics-tip-above${hover.x > svgWidth - 80 ? ' is-right' : hover.x < 80 ? ' is-left' : ''}`}
                style={{ left: hover.x, top: hover.y }}>
                <div className="viz-tooltip-title">Week {hover.d.week} · {hover.d.day}</div>
                <div className="viz-tooltip-row">
                  <span className="viz-swatch" style={{ background: color(valueOf(hover.d)) }} />
                  {diverging ? 'vs average' : 'Logins'} <strong>{fmt(valueOf(hover.d))}</strong>
                </div>
              </div>
            )}
          </div>
        </figure>

        <div className="d3-basics-categorical">
          <strong className="small">Categorical (identity): always in this order</strong>
          <ol>
            {CATEGORICAL.map((name, i) => (
              <li key={name} className={i < 3 ? 'is-core' : undefined}>
                <span className="viz-swatch" style={{ background: `var(--chart-${i + 1})` }} />
                <span className="mono">{i + 1}</span> {name}
              </li>
            ))}
          </ol>
          <p className="small muted m-0">Slots 1–3 (highlighted) are the only ones for scatter plots, maps and networks, where every colour can touch every other.</p>
        </div>
      </div>

      <details className="d3-basics-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption>Average logins per student (fictional)</caption>
            <thead>
              <tr><th scope="col">Day</th>{WEEKS.map((w) => <th key={w} scope="col" className="num">W{w}</th>)}</tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <th scope="row">{day}</th>
                  {cells.filter((d) => d.day === day).map((d) => <td key={d.week} className="num">{d.value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
