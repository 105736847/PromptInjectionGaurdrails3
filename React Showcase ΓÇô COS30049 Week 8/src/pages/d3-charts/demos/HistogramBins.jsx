/**
 * HistogramBins – how many bins? The same 600 exam scores, binned your way.
 * Pattern: D3 owns the <g>. The maths runs during render, the drawing in an effect:
 *   • d3.bin() groups the scores in useMemo, so the table below can use the same bins
 *   • bars are joined BY INDEX and transitioned, so a new bin count visibly re-slices the data
 *   • the kernel density estimate (KDE) shares the bars' y-axis: we scale it to
 *     "expected students per bin", so there is never a second y-axis
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import ChartTooltip from './helpers/ChartTooltip.jsx';
import DataTable from './helpers/DataTable.jsx';
import { columnPath, motion } from './helpers/chartKit.js';
import onPointerDownOutside from './helpers/onPointerDownOutside.js';
import { examScores } from './data/examScores.js';

// The three classic rules of thumb – each returns a suggested NUMBER of bins.
const RULES = [
  { name: 'Sturges', count: d3.thresholdSturges(examScores) },
  { name: 'Scott', count: d3.thresholdScott(examScores, 0, 100) },
  { name: 'Freedman–Diaconis', count: d3.thresholdFreedmanDiaconis(examScores, 0, 100) },
];
const M = { top: 30, right: 12, bottom: 40, left: 40 };
const H = 330;
const innerH = H - M.top - M.bottom;
const N = examScores.length;
const MEAN = d3.mean(examScores);
const MEDIAN = d3.median(examScores);
const GRID = d3.range(0, 100.5, 1); // x positions where we evaluate the density
const SUMMARY = `Histogram of ${N} exam scores with two peaks, around 46 and 74. Mean ${MEAN.toFixed(1)}, median ${MEDIAN}.`;
// Scores are whole numbers, so a bin from 41.2 to under 47.1 really holds the scores 42–47.
// (d3.bin puts the maximum, 100, into the last bin.)
const scoreRange = (b) => `${Math.ceil(b.x0)}–${b.x1 === 100 ? 100 : Math.ceil(b.x1) - 1}`;

// Epanechnikov kernel: a smooth bump of width ±bandwidth. The KDE is the average bump.
const epanechnikov = (bandwidth) => (v) => (Math.abs((v /= bandwidth)) <= 1 ? (0.75 * (1 - v * v)) / bandwidth : 0);
const kde = (kernel, xs, data) => xs.map((x) => [x, d3.mean(data, (d) => kernel(x - d))]);

export default function HistogramBins() {
  const [wrapRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const id = useId();
  const [binCount, setBinCount] = useState(RULES[0].count);
  const [bandwidth, setBandwidth] = useState(6);
  const [showDensity, setShowDensity] = useState(true);
  const [tip, setTip] = useState(null);
  const innerW = Math.max(0, width - M.left - M.right);

  // D3 calculates: equal-width bins between 0 and 100, and the density curve.
  // We pass the exact edges: d3.bin().thresholds(binCount) would round them to "nice" numbers
  // (d3.ticks) – easier to read, but then the slider could not give exactly binCount bins.
  const bins = useMemo(
    () => d3.bin().domain([0, 100]).thresholds(d3.range(1, binCount).map((i) => (100 * i) / binCount))(examScores),
    [binCount],
  );
  const density = useMemo(() => kde(epanechnikov(bandwidth), GRID, examScores), [bandwidth]);

  useEffect(() => {
    if (innerW === 0) return undefined;
    const g = d3.select(gRef.current);
    const binWidth = 100 / binCount;
    const toCount = (p) => p * N * binWidth; // density → expected students per bin
    const x = d3.scaleLinear([0, 100], [0, innerW]);
    const yMax = Math.max(d3.max(bins, (b) => b.length), showDensity ? d3.max(density, (d) => toCount(d[1])) : 0);
    const y = d3.scaleLinear([0, yMax], [innerH, 0]).nice();
    const t = g.transition().duration(motion(650)).ease(d3.easeCubicInOut);

    g.select('.x-axis').call(d3.axisBottom(x).ticks(innerW < 400 ? 5 : 10));
    g.select('.y-axis').transition(t).call(d3.axisLeft(y).ticks(5));
    g.select('.grid').transition(t).call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''));

    // Columns with a 2px surface gap between neighbours (x + 1, width − 2).
    const column = (b, height) => columnPath(x(b.x0) + 1, innerH - height, x(b.x1) - x(b.x0) - 2, height);
    const bars = g
      .select('.bars')
      .selectAll('path')
      .data(bins, (b, i) => i) // key = index: bar 3 stays bar 3 and slides to its new place
      .join(
        (enter) => enter.append('path').attr('class', 'd3c-bar').attr('d', (b) => column(b, 0)),
        (update) => update,
        (exit) => exit.transition(t).attr('d', (b) => column(b, 0)).remove(),
      );
    bars.transition(t).attr('d', (b) => column(b, innerH - y(b.length)));

    const line = d3.line().x((d) => x(d[0])).y((d) => y(toCount(d[1]))).curve(d3.curveBasis);
    g.select('.density').style('--series', 'var(--chart-2)').transition(t)
      .attr('d', line(density)).style('opacity', showDensity ? 1 : 0);

    // Mean and median: labelled rules; the smaller one's label goes left so they never collide.
    const rules = [
      { label: `Mean ${MEAN.toFixed(1)}`, value: MEAN, left: MEAN <= MEDIAN },
      { label: `Median ${MEDIAN}`, value: MEDIAN, left: MEDIAN < MEAN },
    ];
    const ruleG = g.select('.rules').selectAll('g').data(rules).join((enter) => {
      const r = enter.append('g');
      r.append('line').attr('class', 'd3c-rule').attr('y1', -4);
      r.append('text').attr('class', 'viz-label').attr('y', -8);
      return r;
    });
    ruleG.attr('transform', (d) => `translate(${x(d.value)},0)`);
    ruleG.select('line').attr('y2', innerH);
    ruleG.select('text').attr('x', (d) => (d.left ? -4 : 4)).attr('text-anchor', (d) => (d.left ? 'end' : 'start')).text((d) => d.label);

    // Hover: the pointer's x tells us the bin – no need to hit a thin bar exactly.
    const hide = () => {
      bars.classed('is-faded', false);
      setTip(null);
    };
    g.select('.overlay')
      .on('pointermove pointerdown', (event) => {
        const i = Math.max(0, Math.min(bins.length - 1, Math.floor(x.invert(d3.pointer(event)[0]) / binWidth)));
        const b = bins[i];
        bars.classed('is-faded', (d, j) => j !== i);
        setTip({
          x: M.left + x((b.x0 + b.x1) / 2),
          y: M.top + y(b.length),
          title: `Scores ${scoreRange(b)}`,
          rows: [
            { key: 'swatch', color: 'var(--chart-1)', label: 'Students', value: b.length },
            { label: 'Share of the cohort', value: d3.format('.1%')(b.length / N) },
          ],
        });
      })
      .on('pointerleave', (event) => {
        if (event.pointerType !== 'touch') hide(); // a lifted finger also "leaves" – keep the tooltip readable…
      });
    const stopDismiss = onPointerDownOutside(g.node(), hide); // …until the next tap outside the chart

    return () => {
      stopDismiss();
      g.select('.overlay').on('pointermove pointerdown pointerleave', null);
      g.selectAll('*').interrupt();
    };
  }, [bins, density, binCount, showDensity, innerW]);

  return (
    <div>
      <div className="viz-controls">
        <label className="d3c-slider" htmlFor={`${id}-bins`}>
          Bins
          <input id={`${id}-bins`} type="range" min={3} max={40} value={binCount} onChange={(e) => setBinCount(Number(e.target.value))} />
          <output htmlFor={`${id}-bins`}>{binCount}</output>
        </label>
        <div className="btn-group" role="group" aria-label="Rules of thumb for the number of bins">
          {RULES.map((rule) => (
            <button
              key={rule.name}
              type="button"
              className={`btn btn-sm ${binCount === rule.count ? 'active' : ''}`}
              aria-pressed={binCount === rule.count}
              onClick={() => setBinCount(rule.count)}
              title={`${rule.count} bins`}
            >
              {rule.name}
            </button>
          ))}
        </div>
      </div>
      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={showDensity} onChange={(e) => setShowDensity(e.target.checked)} />
          <span className="switch-track" aria-hidden="true" />
          Density curve
        </label>
        <label className="d3c-slider" htmlFor={`${id}-bw`}>
          Bandwidth
          <input id={`${id}-bw`} type="range" min={1} max={15} step={0.5} value={bandwidth} disabled={!showDensity} onChange={(e) => setBandwidth(Number(e.target.value))} />
          <output htmlFor={`${id}-bw`}>±{bandwidth}</output>
        </label>
      </div>
      <ul className="viz-legend" aria-label="Legend">
        <li><span className="viz-swatch" style={{ background: 'var(--chart-1)' }} aria-hidden="true" />Students per bin</li>
        {showDensity && (
          <li><span className="viz-key-line" style={{ background: 'var(--chart-2)' }} aria-hidden="true" />Density (KDE)</li>
        )}
        <li><span className="viz-key-line" style={{ background: 'var(--color-text-muted)', width: 2, height: 12 }} aria-hidden="true" />Mean / median</li>
      </ul>
      <div className="viz" ref={wrapRef}>
        <svg width={width} height={H} role="group" aria-label={SUMMARY}>
          <g ref={gRef} transform={`translate(${M.left},${M.top})`}>
            <text className="viz-axis-title" x={-M.left} y={-14}>Students</text>
            <text className="viz-axis-title" x={innerW} y={innerH + 34} textAnchor="end">Exam score</text>
            <g className="viz-grid grid" />
            <g className="bars" />
            <path className="density d3c-line" />
            <g className="rules" />
            <g className="viz-axis x-axis" transform={`translate(0,${innerH})`} />
            <g className="viz-axis y-axis" />
            <rect className="overlay d3c-overlay d3c-scrub" width={innerW} height={innerH} />
          </g>
        </svg>
        <ChartTooltip tip={tip} />
      </div>
      <DataTable
        caption={`${bins.length} bins`}
        columns={['Score range', 'Students', 'Share']}
        rows={bins.map((b) => [scoreRange(b), b.length, d3.format('.1%')(b.length / N)])}
      />
    </div>
  );
}
