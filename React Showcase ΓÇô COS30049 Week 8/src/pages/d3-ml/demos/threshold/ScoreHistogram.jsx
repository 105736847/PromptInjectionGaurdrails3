/**
 * ScoreHistogram – the model's scores for each TRUE class, mirrored around a
 * baseline (legitimate above, phishing below), with a draggable threshold.
 *
 * Pattern: D3 calculates, React renders
 * d3.bin + d3.scaleLinear compute the numbers, React draws every <path>.
 * Dragging, tapping and the arrow keys live in a custom hook,
 * useThresholdDrag.js (d3.drag as a BEHAVIOUR only).
 */
import { useId, useMemo, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../../hooks/useElementSize.js';
import ChartTooltip, { TooltipRow } from '../helpers/ChartTooltip.jsx';
import { columnPath, num, pct } from '../helpers/chart.js';
import useThresholdDrag from './useThresholdDrag.js';

const BINS = 40;
const HEIGHT = 290;
const M = { top: 34, right: 12, bottom: 40, left: 46 };
const CLASSES = [
  { label: 0, name: 'Legitimate', color: 'var(--chart-1)' },
  { label: 1, name: 'Phishing', color: 'var(--chart-2)' },
];

export default function ScoreHistogram({ rows, threshold, onThresholdChange, mode, matrix }) {
  const [ref, { width }] = useElementSize();
  const [hoverBin, setHoverBin] = useState(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // safe for url(#id)

  // d3.bin() sorts every score into one of 40 equal-width buckets – per class.
  const bins = useMemo(() => {
    const binner = d3.bin().value((d) => d.score).domain([0, 1])
      .thresholds(d3.range(1, BINS).map((i) => i / BINS));
    return CLASSES.map(({ label }) => {
      const members = rows.filter((d) => d.label === label);
      return binner(members).map((b) => ({ x0: b.x0, x1: b.x1, count: b.length, share: b.length / members.length }));
    });
  }, [rows]);

  // Scales: x = score → pixels. Two y scales share ONE domain (so both halves
  // are comparable) but point in opposite directions from the middle baseline.
  const x = useMemo(() => d3.scaleLinear([0, 1], [M.left, Math.max(M.left + 1, width - M.right)]), [width]);
  const value = (b) => (mode === 'share' ? b.share : b.count);
  const mid = M.top + (HEIGHT - M.top - M.bottom) / 2;
  const up = d3.scaleLinear([0, d3.max(bins.flat(), value)], [mid, M.top]).nice();
  const down = d3.scaleLinear(up.domain(), [mid, HEIGHT - M.bottom]);
  const fmt = mode === 'share' ? d3.format('.0%') : num;
  // The drag / tap / keyboard behaviour (a custom hook – see useThresholdDrag.js).
  const { overlayRef, handleRef, dragging, handleSurfaceClick, handleKeyDown } =
    useThresholdDrag(x, threshold, onThresholdChange);

  function handlePointerMove(event) {
    const [px] = d3.pointer(event.nativeEvent, event.currentTarget.ownerSVGElement);
    setHoverBin(Math.min(BINS - 1, Math.max(0, Math.floor(x.invert(px) * BINS))));
  }

  const tx = x(threshold);
  const band = x(1 / BINS) - x(0);
  const barW = Math.min(24, Math.max(1, band - 2)); // 2px surface gap between neighbours
  const plotRight = width - M.right;

  function bars(classIndex) {
    const y = classIndex === 0 ? up : down;
    return bins[classIndex].map((b) =>
      b.count === 0 ? null : (
        <path key={b.x0} d={columnPath(x(b.x0) + (band - barW) / 2, barW, mid, y(value(b)))} />
      ),
    );
  }

  return (
    <figure className="d3ml-figure">
      <figcaption className="d3ml-figure-title">Score distribution by true class</figcaption>
      <ul className="viz-legend">
        {CLASSES.map((c) => (
          <li key={c.name}>
            <span className="viz-swatch" style={{ background: c.color }} />
            {c.name} ({num(bins[c.label].reduce((s, b) => s + b.count, 0))})
          </li>
        ))}
        <li className="subtle">Faded bars = classified correctly · strong bars = errors</li>
      </ul>
      <div className="viz" ref={ref}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="group"
            aria-label={`Mirrored histogram of model scores. Threshold ${threshold.toFixed(2)}: ${matrix.fp} false positives above it, ${matrix.fn} missed phishing URLs below it.`}>
            <defs>
              <clipPath id={`${uid}-fp`}><rect x={tx} y={0} width={Math.max(0, width - tx)} height={HEIGHT} /></clipPath>
              <clipPath id={`${uid}-fn`}><rect x={0} y={0} width={Math.max(0, tx)} height={HEIGHT} /></clipPath>
            </defs>

            {/* Everything right of the line is PREDICTED phishing (a neutral wash: orange already means the class) */}
            <rect x={tx} y={M.top} width={Math.max(0, plotRight - tx)} height={HEIGHT - M.top - M.bottom}
              style={{ fill: 'var(--color-text)', opacity: 0.045 }} />

            <g className="viz-grid">
              {up.ticks(3).filter(Boolean).flatMap((t) => [up(t), down(t)]).map((py) => (
                <line key={py} x1={M.left} x2={plotRight} y1={py} y2={py} />
              ))}
            </g>
            <g className="viz-axis">
              {up.ticks(3).map((t) => (
                <g key={t}>
                  <text x={M.left - 8} y={up(t)} dy="0.32em" textAnchor="end">{fmt(t)}</text>
                  {t > 0 && <text x={M.left - 8} y={down(t)} dy="0.32em" textAnchor="end">{fmt(t)}</text>}
                </g>
              ))}
              {x.ticks(width < 520 ? 5 : 10).map((t) => (
                <text key={t} x={x(t)} y={HEIGHT - M.bottom + 16} textAnchor="middle">{t}</text>
              ))}
            </g>
            <text className="viz-axis-title" x={(M.left + plotRight) / 2} y={HEIGHT - 4} textAnchor="middle">
              Model score (predicted probability of phishing)
            </text>

            {/* Layer 1: all bars, faded. Layers 2 + 3: the ERRORS, clipped to their side of the line */}
            <g style={{ fill: CLASSES[0].color, opacity: 0.4 }}>{bars(0)}</g>
            <g style={{ fill: CLASSES[1].color, opacity: 0.4 }}>{bars(1)}</g>
            <g style={{ fill: CLASSES[0].color }} clipPath={`url(#${uid}-fp)`}>{bars(0)}</g>
            <g style={{ fill: CLASSES[1].color }} clipPath={`url(#${uid}-fn)`}>{bars(1)}</g>
            <line className="d3ml-baseline" x1={M.left} x2={plotRight} y1={mid} y2={mid} />

            {/* Selective direct labels: the two error counts, next to the line (the halo keeps them readable over bars) */}
            {plotRight - tx > 120 && (
              <text className="viz-label d3ml-halo" x={tx + 8} y={M.top + 14}>{matrix.fp} false positives →</text>
            )}
            {tx - M.left > 120 && (
              <text className="viz-label d3ml-halo" x={tx - 8} y={HEIGHT - M.bottom - 8} textAnchor="end">← {matrix.fn} missed (FN)</text>
            )}

            {hoverBin !== null && !dragging && (
              <rect x={x(hoverBin / BINS)} y={M.top} width={band} height={HEIGHT - M.top - M.bottom}
                style={{ fill: 'var(--color-text)', opacity: 0.06 }} />
            )}

            {/* The drag surface: the whole plot area (a big, forgiving hit target). A tap moves the line too. */}
            <rect ref={overlayRef} className="d3ml-drag-surface" x={M.left} y={M.top}
              width={Math.max(0, plotRight - M.left)} height={HEIGHT - M.top - M.bottom}
              onPointerMove={handlePointerMove} onPointerLeave={() => setHoverBin(null)} onClick={handleSurfaceClick} />

            {/* The threshold line + handle – focusable, works with arrow keys */}
            <g ref={handleRef} className="d3ml-handle" transform={`translate(${tx},0)`} tabIndex={0}
              role="slider" aria-label="Decision threshold" aria-valuemin={0} aria-valuemax={1}
              aria-valuenow={+threshold.toFixed(2)} onKeyDown={handleKeyDown}>
              <line y1={M.top - 6} y2={HEIGHT - M.bottom} />
              <rect x={-22} y={M.top - 28} width={44} height={22} rx={11} />
              <text y={M.top - 13} textAnchor="middle">{threshold.toFixed(2)}</text>
            </g>
          </svg>
        )}
        {hoverBin !== null && !dragging && width > 0 && (
          <ChartTooltip x={x((hoverBin + 0.5) / BINS)} y={mid} width={width}
            title={`Score ${(hoverBin / BINS).toFixed(3)} – ${((hoverBin + 1) / BINS).toFixed(3)}`}>
            {CLASSES.map((c) => {
              const b = bins[c.label][hoverBin];
              return (
                <TooltipRow key={c.name} color={c.color} label={c.name} detail={`(${pct(b.share)} of class)`} value={num(b.count)} />
              );
            })}
          </ChartTooltip>
        )}
      </div>
    </figure>
  );
}
