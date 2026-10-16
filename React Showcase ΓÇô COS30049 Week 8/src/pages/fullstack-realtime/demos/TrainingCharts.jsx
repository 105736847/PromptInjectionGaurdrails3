/**
 * TrainingCharts – loss and accuracy per epoch (training vs validation), growing live.
 *
 * Pattern: D3 calculates, React renders. Each WebSocket message adds one point to `history`;
 * React re-renders and d3.line() turns the numbers into new path strings – no D3 DOM code.
 * Both charts share ONE x scale and the same margins, so an epoch sits at the same place in
 * both: hover either chart and the crosshair appears in both.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';

const SERIES = [
  { key: 'train', label: 'Training', color: 'var(--chart-1)' },
  { key: 'val', label: 'Validation', color: 'var(--chart-2)' },
];
const H = 200;
const M = { top: 10, right: 14, bottom: 26, left: 40 };
const innerH = H - M.top - M.bottom;

function MetricChart({ title, metric, format, yDomain, history, x, innerW, hover, setHover }) {
  const y = d3.scaleLinear(yDomain, [innerH, 0]).nice(4); // same count as the ticks → the top line is labelled
  const line = (series) => d3.line().x((d) => x(d.epoch)).y((d) => y(d[`${series}_${metric}`]))(history);
  const point = hover ? history.find((d) => d.epoch === hover.epoch) : null;
  const last = history.at(-1)?.epoch ?? 0;

  // Pointer x (pixels) → nearest epoch that has data.
  function track(event) {
    if (!last) return;
    const epoch = Math.round(x.invert(event.clientX - event.currentTarget.getBoundingClientRect().left));
    setHover({ epoch: Math.max(1, Math.min(last, epoch)), metric });
  }

  const tipLeft = point ? M.left + x(point.epoch) : 0;
  return (
    <figure className="rt-chart">
      <figcaption>{title}</figcaption>
      <div className="viz">
        <svg width={innerW + M.left + M.right} height={H} role="img"
          aria-label={`${title} per epoch for the training and validation data${last ? `, ${last} epochs so far` : ''}`}>
          <g transform={`translate(${M.left},${M.top})`}>
            <g className="viz-grid">
              {y.ticks(4).map((t) => <line key={t} x2={innerW} y1={y(t)} y2={y(t)} />)}
            </g>
            <g className="viz-axis">
              {y.ticks(4).map((t) => <text key={t} x={-8} y={y(t)} dy="0.32em" textAnchor="end">{format(t)}</text>)}
              <line x2={innerW} y1={innerH} y2={innerH} />
              {x.ticks(Math.max(2, Math.floor(innerW / 60))).filter(Number.isInteger).map((t) => (
                <text key={t} x={x(t)} y={innerH + 17} textAnchor="middle">{t}</text>
              ))}
            </g>
            {!last && <text className="rt-empty-label" x={innerW / 2} y={innerH / 2} textAnchor="middle">Waiting for the first epoch…</text>}
            {SERIES.map((s) => <path key={s.key} className="rt-line" d={line(s.key) ?? undefined} style={{ stroke: s.color }} />)}
            {point && (
              <g transform={`translate(${x(point.epoch)},0)`}>
                <line className="rt-crosshair" y2={innerH} />
                {SERIES.map((s) => (
                  <circle key={s.key} className="rt-dot" r={4} cy={y(point[`${s.key}_${metric}`])} style={{ fill: s.color }} />
                ))}
              </g>
            )}
            <rect width={innerW} height={innerH} fill="transparent" onPointerMove={track} onPointerDown={track} onPointerLeave={() => setHover(null)} />
          </g>
        </svg>
        {point && hover.metric === metric && (
          <div className="viz-tooltip" style={{ top: M.top + 8, ...(tipLeft > innerW / 2 ? { right: innerW + M.left + M.right - tipLeft + 12 } : { left: tipLeft + 12 }) }}>
            <div className="viz-tooltip-title">Epoch {point.epoch}</div>
            {SERIES.map((s) => (
              <div key={s.key} className="viz-tooltip-row">
                <span className="viz-key-line" style={{ background: s.color }} />
                <strong>{format(point[`${s.key}_${metric}`])}</strong> {s.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}

export default function TrainingCharts({ history, epochs }) {
  const [ref, { width }] = useElementSize();
  const [hover, setHover] = useState(null); // { epoch, metric } – shared by both charts
  // Side by side when there is room, stacked on phones (16 px gap between the two columns).
  const twoColumns = width >= 600;
  const chartWidth = twoColumns ? (width - 16) / 2 : width;
  const innerW = Math.max(0, chartWidth - M.left - M.right);
  const x = d3.scaleLinear([1, Math.max(2, epochs)], [0, innerW]);
  const maxLoss = d3.max(history, (d) => Math.max(d.train_loss, d.val_loss)) ?? 2.5;

  return (
    <div>
      <ul className="viz-legend" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key}><span className="viz-key-line" style={{ background: s.color }} aria-hidden="true" />{s.label}</li>
        ))}
      </ul>
      <div className="rt-train-charts" ref={ref} style={{ gridTemplateColumns: twoColumns ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>
        {innerW > 0 && (
          <>
            <MetricChart title="Loss (lower is better)" metric="loss" format={d3.format('.2f')} yDomain={[0, Math.max(0.5, maxLoss)]}
              history={history} x={x} innerW={innerW} hover={hover} setHover={setHover} />
            <MetricChart title="Accuracy (higher is better)" metric="acc" format={d3.format('.0%')} yDomain={[0, 1]}
              history={history} x={x} innerW={innerW} hover={hover} setHover={setHover} />
          </>
        )}
      </div>
    </div>
  );
}
