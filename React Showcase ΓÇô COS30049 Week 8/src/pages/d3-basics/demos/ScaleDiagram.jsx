/**
 * ScaleDiagram – a scale drawn as two rulers: the DOMAIN (input) on top, the
 * RANGE (output) below, and a curve from each input to where the scale sends
 * it. Parallel, evenly spaced curves = linear; fanning curves = non-linear.
 * Pattern: D3 calculates, React renders.
 * d3-scale and d3.linkVertical compute positions and path strings; JSX draws them.
 */
import * as d3 from 'd3';
import { LAYOUT, Ruler, DragBand, Marker, Flag } from './helpers/ScaleParts.jsx';
import { formatNumber, formatDay } from './helpers/scaleSpecs.js';

const { height: HEIGHT, pad: PAD, top: TOP, bottom: BOTTOM } = LAYOUT;
const link = d3.linkVertical().x((d) => d[0]).y((d) => d[1]); // smooth S-curve between two points
const clampX = (x, width) => Math.max(PAD, Math.min(width - PAD, x));
const swatchOf = (v) => (/^var\(--chart-\d\)$/.test(v) ? v : 'var(--color-text-subtle)');
const shortName = (v) => v.replace(/^var\(--(chart-\d)\)$/, '$1'); // 'var(--chart-3)' → 'chart-3' for the pill label
const tickCount = (width) => Math.max(3, Math.floor(width / 110)); // at least 3 labels, even on a phone

export default function ScaleDiagram(props) {
  const View = { continuous: ContinuousView, band: BandView, ordinal: OrdinalView, segments: SegmentsView }[props.type.kind];
  return (
    <svg width={props.width} height={HEIGHT} role="group" aria-label={`${props.type.fn}: domain on top, range below`}>
      <View {...props} />
    </svg>
  );
}

function ContinuousView({ type, scale, input, onInput, width }) {
  const isTime = type.id === 'time';
  const format = isTime ? formatDay : formatNumber;
  const grow = type.id === 'log' ? 0 : 0.15; // show a little OUTSIDE the domain, so clamp() has something to do
  const widen = (a, b) => [a - (b - a) * grow, b + (b - a) * grow];
  const [dMin, dMax] = d3.extent(scale.domain(), (d) => +d);
  const [rMin, rMax] = d3.extent(scale.range());
  const top = (isTime ? d3.scaleTime() : d3.scaleLinear()).domain(widen(dMin, dMax)).range([PAD, width - PAD]);
  const bottom = d3.scaleLinear().domain(widen(rMin, rMax)).range([PAD, width - PAD]);
  const n = tickCount(width);
  const topFormat = isTime && width < 480 ? d3.timeFormat('%b') : top.tickFormat(n); // "Apr" instead of "April" on phones

  // Draw a mapping curve for every top tick inside the domain (+ powers of ten for log).
  let mapped = top.ticks(n).filter((t) => +t >= dMin && +t <= dMax);
  if (type.id === 'log' && dMin > 0) {
    const decades = d3.range(Math.ceil(Math.log10(dMin)), Math.floor(Math.log10(dMax)) + 1).map((p) => 10 ** p);
    mapped = [...new Set([...mapped, ...decades])];
  }

  const output = scale(input);
  const hasOutput = Number.isFinite(output); // safety net: never write NaN into the SVG
  const inX = clampX(top(input), width);
  const outX = hasOutput ? clampX(bottom(output), width) : PAD;
  const fromBottom = (px) => onInput(scale.invert(bottom.invert(px))); // ← scale.invert: output → input

  return (
    <>
      <g className="d3-basics-map-lines">
        {mapped.map((t) => (
          <path key={+t} d={link({ source: [top(t), TOP + 4], target: [bottom(scale(t)), BOTTOM - 4] })} />
        ))}
      </g>
      {hasOutput && <path className="d3-basics-map-active" d={link({ source: [inX, TOP + 4], target: [outX, BOTTOM - 4] })} />}
      <Ruler y={TOP} width={width} side="top" ticks={top.ticks(n)} position={top} format={topFormat} highlight={[top(dMin), top(dMax)]} />
      <Ruler y={BOTTOM} width={width} side="bottom" ticks={bottom.ticks(n)} position={bottom} format={bottom.tickFormat(n)} highlight={[bottom(rMin), bottom(rMax)]} />
      <DragBand y={TOP} width={width} onPixel={(px) => onInput(top.invert(px))} />
      <DragBand y={BOTTOM} width={width} onPixel={fromBottom} />
      <Marker x={inX} y={TOP} side="top" width={width} label={`x = ${format(input)}`} ariaLabel="Input value (domain)"
        valueNow={+input} valueText={format(input)} onNudge={(dx) => onInput(top.invert(clampX(inX + dx, width)))} />
      {hasOutput && (
        <Marker x={outX} y={BOTTOM} side="bottom" width={width} label={`scale(x) = ${formatNumber(output)}`} ariaLabel="Output value (range)"
          valueNow={output} valueText={formatNumber(output)} onNudge={(dx) => fromBottom(clampX(outX + dx, width))} />
      )}
    </>
  );
}

/** Categories along the top: click (or Enter/Space) to pick one. */
function CategoryButtons({ items, position, selected, onSelect, y, labelY = -12, className = 'd3-basics-category' }) {
  return items.map((item, i) => (
    <g key={i} className={className} transform={`translate(${position(item, i)},${y})`} role="button" tabIndex={0}
      aria-pressed={selected(item, i)} aria-label={String(item)} onClick={() => onSelect(item, i)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item, i); } }}>
      <rect className="d3-basics-hit" x={-24} y={-30} width={48} height={44} />
      <circle r={selected(item, i) ? 7 : 4} />
      <text y={labelY} textAnchor="middle">{item}</text>
    </g>
  ));
}

function BandView({ type, scale, input, onInput, width }) {
  const cats = scale.domain();
  const top = d3.scalePoint().domain(cats).range([PAD, width - PAD]).padding(0.5);
  const [rMin, rMax] = d3.extent(scale.range());
  const bottom = d3.scaleLinear().domain([rMin, rMax]).range([PAD, width - PAD]);
  const bw = scale.bandwidth(); // 0 for scalePoint
  const n = tickCount(width);
  const activeX = bottom(scale(input) + bw / 2);
  return (
    <>
      <line className="d3-basics-ruler-plain" x1={PAD} x2={width - PAD} y1={TOP} y2={TOP} />
      <Ruler y={BOTTOM} width={width} side="bottom" ticks={bottom.ticks(n)} position={bottom} format={bottom.tickFormat(n)} highlight={[PAD, width - PAD]} />
      {cats.map((c) => {
        const [a, b] = [bottom(scale(c)), bottom(scale(c) + bw)];
        const active = c === input;
        return (
          <g key={c}>
            <path className={active ? 'd3-basics-map-active' : 'd3-basics-map-line'} d={link({ source: [top(c), TOP + 4], target: [(a + b) / 2, BOTTOM - 16] })} />
            {type.id === 'band' ? (
              <rect className={`d3-basics-band${active ? ' is-active' : ''}`} x={Math.min(a, b)} y={BOTTOM - 14} width={Math.max(1, Math.abs(b - a))} height={12} rx={2} />
            ) : (
              <circle className={`d3-basics-band${active ? ' is-active' : ''}`} cx={a} cy={BOTTOM - 8} r={5} />
            )}
          </g>
        );
      })}
      <CategoryButtons items={cats} position={top} y={TOP} selected={(c) => c === input} onSelect={onInput} />
      <Flag x={clampX(activeX, width)} y={BOTTOM + 40} width={width}>
        {`scale('${input}') = ${formatNumber(scale(input))}`}
      </Flag>
    </>
  );
}

function OrdinalView({ scale, input, onInput, width }) {
  const cats = scale.domain();
  const values = scale.range();
  const top = d3.scalePoint().domain(cats).range([PAD, width - PAD]).padding(0.5);
  const slot = d3.scalePoint().domain(d3.range(values.length)).range([PAD, width - PAD]).padding(0.5);
  const slotOf = (c) => values.indexOf(scale(c)); // which range value did this category get?
  return (
    <>
      <line className="d3-basics-ruler-plain" x1={PAD} x2={width - PAD} y1={TOP} y2={TOP} />
      {cats.map((c, i) => (
        <path key={c} className={c === input ? 'd3-basics-map-active' : i >= values.length ? 'd3-basics-map-reused' : 'd3-basics-map-line'}
          d={link({ source: [top(c), TOP + 4], target: [slot(slotOf(c)), BOTTOM - 10] })} />
      ))}
      <CategoryButtons items={cats} position={top} y={TOP} selected={(c) => c === input} onSelect={onInput} />
      {values.map((v, i) => (
        <g key={i} className="d3-basics-pill" transform={`translate(${slot(i)},${BOTTOM})`}>
          <circle r={8} style={{ fill: swatchOf(v) }} />
          <text y={24} textAnchor="middle">{shortName(v)}</text>
        </g>
      ))}
      <Flag x={clampX(slot(slotOf(input)), width)} y={BOTTOM + 44} width={width}>
        {`scale('${input}') = '${scale(input)}'`}
      </Flag>
    </>
  );
}

function SegmentsView({ type, scale, input, onInput, width }) {
  const values = scale.range();
  const cuts = type.id === 'quantize' ? scale.thresholds() : scale.domain();
  const spread = cuts[cuts.length - 1] - cuts[0] || 20;
  const [lo, hi] = type.id === 'quantize' ? scale.domain() : d3.nice(cuts[0] - spread * 0.4, cuts[cuts.length - 1] + spread * 0.4, 5);
  const top = d3.scaleLinear().domain([lo, hi]).range([PAD, width - PAD]);
  const bounds = [lo, ...cuts, hi];
  const segments = d3.range(Math.min(values.length, bounds.length - 1)).map((i) => ({ i, from: bounds[i], to: bounds[i + 1] }));
  const slot = d3.scalePoint().domain(d3.range(values.length)).range([PAD, width - PAD]).padding(0.5);
  const active = values.indexOf(scale(input));
  const shade = (i) => `var(--seq-${2 + Math.round((i * 5) / Math.max(1, segments.length - 1))})`; // one hue, light → dark
  return (
    <>
      {segments.map((s) => (
        <g key={s.i}>
          <rect x={top(s.from) + 1} y={TOP + 3} width={Math.max(0, top(s.to) - top(s.from) - 2)} height={10} rx={2} style={{ fill: shade(s.i) }} />
          <path className={s.i === active ? 'd3-basics-map-active' : 'd3-basics-map-line'}
            d={link({ source: [(top(s.from) + top(s.to)) / 2, TOP + 15], target: [slot(s.i), BOTTOM - 12] })} />
        </g>
      ))}
      <Ruler y={TOP} width={width} side="top" ticks={bounds} position={top} format={formatNumber} />
      <CategoryButtons items={values} position={(v, i) => slot(i)} y={BOTTOM} labelY={24} className="d3-basics-category is-output"
        selected={(v, i) => i === active} onSelect={(v, i) => segments[i] && onInput((segments[i].from + segments[i].to) / 2)} />
      <DragBand y={TOP} width={width} onPixel={(px) => onInput(top.invert(px))} />
      <Marker x={clampX(top(input), width)} y={TOP} side="top" width={width} label={`x = ${formatNumber(input)}`} ariaLabel="Input value"
        valueNow={input} valueText={formatNumber(input)} onNudge={(dx) => onInput(top.invert(clampX(top(input) + dx, width)))} />
      {active >= 0 && (
        <Flag x={clampX(slot(active), width)} y={BOTTOM + 44} width={width}>
          {`scale(x) = '${values[active]}'`}
        </Flag>
      )}
    </>
  );
}
