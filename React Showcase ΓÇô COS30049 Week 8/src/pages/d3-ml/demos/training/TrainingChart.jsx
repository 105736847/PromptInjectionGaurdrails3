/**
 * TrainingChart – ONE metric (loss or accuracy) per epoch for several runs.
 *
 * Pattern: D3 owns the <g>
 * The scales are calculated during render (React needs them for the
 * crosshair too); the effect hands them to D3, which draws
 * axes + lines with a keyed join and transitions. React draws the crosshair in
 * its OWN elements – React and D3 never touch the same node.
 */
import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import ChartTooltip, { TooltipRow } from '../helpers/ChartTooltip.jsx';
import { EPOCHS } from '../data/trainingHistory.js';

const M = { top: 26, right: 16, bottom: 30, left: 52 };
// A default of `markers = []` would be a NEW array on every render – and a new
// value in the effect's deps re-runs the whole effect (on every hover move!).
const NO_MARKERS = [];

export default function TrainingChart({
  title, width, height = 210, runs, metric, logScale = false, format, tickFormat = format, progress, duration, hoverEpoch, onHover,
  markers = NO_MARKERS, xTitle,
}) {
  const gRef = useRef(null);
  const valKey = `val_${metric}`;
  const bottom = M.bottom + (xTitle ? 18 : 0); // room for the x-axis title
  const compact = width < 480; // phones: shorter labels and tooltips

  const x = useMemo(() => d3.scaleLinear([1, EPOCHS], [M.left, width - M.right]), [width]);
  const y = useMemo(() => {
    const values = runs.flatMap((r) => [...r.history[metric], ...r.history[valKey]].map((d) => d.value));
    const [lo, hi] = values.length ? d3.extent(values) : [0.01, 1];
    const range = [height - bottom, M.top];
    // A log scale spreads out the small losses at the end of training.
    return logScale ? d3.scaleLog([lo * 0.95, hi * 1.05], range).nice() : d3.scaleLinear([lo, hi], range).nice();
  }, [runs, metric, valKey, logScale, height, bottom]);

  useEffect(() => {
    const g = d3.select(gRef.current);
    const t = d3.transition().duration(duration).ease(d3.easeCubicInOut);
    const innerW = width - M.left - M.right;
    // On a log scale, only label/grid the powers of ten (0.01, 0.1, 1) – cleaner than every minor tick.
    const ticks = logScale ? y.ticks().filter((v) => Number.isInteger(Math.log10(v))) : y.ticks(5);

    // .data([null]).join('g') = "make sure exactly ONE group exists" (safe to re-run).
    const grid = g.selectAll('g.grid').data([null]).join('g').attr('class', 'viz-grid grid')
      .attr('transform', `translate(${M.left},0)`);
    grid.transition(t).call(d3.axisLeft(y).tickValues(ticks).tickSize(-innerW).tickFormat(''));
    g.selectAll('g.x-axis').data([null]).join('g').attr('class', 'viz-axis x-axis')
      .attr('transform', `translate(0,${height - bottom})`)
      .call(d3.axisBottom(x).ticks(Math.min(8, innerW / 60)).tickSizeOuter(0));
    g.selectAll('g.y-axis').data([null]).join('g').attr('class', 'viz-axis y-axis')
      .attr('transform', `translate(${M.left},0)`)
      .transition(t)
      .call(d3.axisLeft(y).tickValues(ticks).tickFormat(logScale ? d3.format('~g') : tickFormat));

    // One path per run × (train, validation). The key keeps each line's identity.
    const line = d3.line().x((d) => x(d.epoch)).y((d) => y(d.value)).curve(d3.curveMonotoneX);
    const lines = runs.flatMap((r) => [
      { id: `${r.id}-train`, kind: 'train', color: r.color, values: r.history[metric].slice(0, progress) },
      { id: `${r.id}-val`, kind: 'val', color: r.color, values: r.history[valKey].slice(0, progress) },
    ]);
    g.selectAll('path.d3ml-line')
      .data(lines, (d) => d.id)
      .join(
        (enter) => enter.append('path')
          .attr('class', (d) => `d3ml-line is-${d.kind}`)
          .style('stroke', (d) => d.color)
          .attr('d', (d) => line(d.values))
          .style('opacity', 0), // new lines fade in…
        (update) => update,
        // …old ones fade out. The class marks them, so the cleanup can finish the job
        // if this effect re-runs mid-fade (interrupt() would stop the .remove()).
        (exit) => exit.classed('is-exiting', true).transition(t).style('opacity', 0).remove(),
      )
      // Transition the MERGED selection (enter + update) to its final state. This also
      // makes the effect idempotent: if StrictMode's cleanup interrupted the fade-in,
      // the second run still ends at opacity 1.
      .transition(t)
      .style('opacity', 1)
      .attr('d', (d) => line(d.values));

    // "Live" head dots while the replay is running.
    g.selectAll('circle.d3ml-head')
      .data(progress < EPOCHS ? runs : [], (r) => r.id)
      .join('circle')
      .attr('class', 'd3ml-head')
      .attr('r', 4)
      .style('fill', (r) => r.color)
      .attr('cx', x(progress))
      .attr('cy', (r) => y(r.history[valKey][progress - 1].value));

    // Early-stopping markers (only once the replay has reached them).
    const shown = markers.filter((m) => m.epoch <= progress);
    g.selectAll('circle.d3ml-marker').data(shown, (m) => m.id)
      .join((enter) => enter.append('circle').attr('class', 'd3ml-marker').attr('r', 5)
        .attr('cx', (m) => x(m.epoch)).attr('cy', (m) => y(m.value)))
      .style('fill', (m) => m.color)
      .transition(t).attr('cx', (m) => x(m.epoch)).attr('cy', (m) => y(m.value));
    g.selectAll('text.d3ml-marker-label').data(shown, (m) => m.id)
      .join((enter) => enter.append('text').attr('class', 'viz-label-muted d3ml-marker-label')
        .attr('text-anchor', 'middle').attr('x', (m) => x(m.epoch)).attr('y', (m) => y(m.value) - 12))
      .text((m) => (compact ? `best: ep ${m.epoch}` : `best · epoch ${m.epoch}`))
      .transition(t).attr('x', (m) => x(m.epoch)).attr('y', (m) => y(m.value) - 12);

    return () => {
      g.selectAll('.is-exiting').remove(); // an interrupted exit would otherwise stay on screen
      g.selectAll('*').interrupt();
    };
  }, [x, y, runs, metric, valKey, progress, duration, width, height, bottom, compact, logScale, tickFormat, markers]);

  function handlePointerMove(event) {
    const [px] = d3.pointer(event.nativeEvent, event.currentTarget);
    const epoch = Math.round(x.invert(px));
    onHover(Math.max(1, Math.min(progress, epoch)));
  }

  const cx = hoverEpoch ? x(hoverEpoch) : 0;
  return (
    <div className="viz">
      {/* role="group", not "img": "img" hides every child, but this chart reacts to hover and taps */}
      <svg width={width} height={height} role="group" aria-label={`${title} per epoch for ${runs.map((r) => r.name).join(', ')}.`}>
        <text className="viz-label" x={M.left} y={12} fontWeight={600}>{title}</text>
        <g ref={gRef} />
        {/* React-owned crosshair: shares hoverEpoch with the other chart */}
        {hoverEpoch && (
          <g className="d3ml-crosshair">
            <line x1={cx} x2={cx} y1={M.top} y2={height - bottom} />
            {runs.map((r) => (
              <circle key={r.id} cx={cx} cy={y(r.history[valKey][hoverEpoch - 1].value)} r={4} style={{ fill: r.color }} />
            ))}
          </g>
        )}
        {xTitle && (
          <text className="viz-axis-title" x={(M.left + width - M.right) / 2} y={height - 4} textAnchor="middle">{xTitle}</text>
        )}
        {/* Mouse: hover. Phone: tap (onClick) – and since a finger "leaves" the moment it
            lifts, only a mouse leaving clears the crosshair. */}
        <rect x={M.left} y={M.top} width={Math.max(0, width - M.left - M.right)} height={height - M.top - bottom}
          fill="transparent" onPointerMove={handlePointerMove} onClick={handlePointerMove}
          onPointerLeave={(event) => event.pointerType !== 'touch' && onHover(null)} />
      </svg>
      {hoverEpoch && runs.length > 0 && (
        <ChartTooltip x={cx} y={height / 2} width={width} title={`Epoch ${hoverEpoch} · validation ${metric}`}>
          {/* On a phone the training value would wrap every row – the faded line shows it anyway. */}
          {runs.map((r) => (
            <TooltipRow key={r.id} keyType="line" color={r.color} label={r.short}
              detail={compact ? null : `(train ${format(r.history[metric][hoverEpoch - 1].value)})`}
              value={format(r.history[valKey][hoverEpoch - 1].value)} />
          ))}
        </ChartTooltip>
      )}
    </div>
  );
}
