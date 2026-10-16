/**
 * LossSparkline – a word-sized line chart of the recent training loss.
 *
 * Pattern: D3 calculates, React renders
 * Scales + d3.line compute one path string; React renders one <path>.
 * Neutral ink, not a series colour: in this demo blue and red mean class A / B.
 */
import * as d3 from 'd3';

const W = 200;
const H = 44;

export default function LossSparkline({ values }) {
  if (values.length < 2) return <p className="small subtle m-0">The loss curve appears once training starts.</p>;
  const x = d3.scaleLinear([0, values.length - 1], [2, W - 6]);
  const y = d3.scaleLinear([0, d3.max(values)], [H - 3, 4]);
  const line = d3.line().x((d, i) => x(i)).y((d) => y(d)).curve(d3.curveMonotoneX);
  const last = values.at(-1);
  return (
    <figure className="d3ml-figure">
      <figcaption className="small muted">Loss (last {values.length} frames)</figcaption>
      <svg width={W} height={H} role="img" aria-label={`Loss went from ${values[0].toFixed(3)} to ${last.toFixed(3)}.`}>
        <path d={line(values)} style={{ fill: 'none', stroke: 'var(--color-text-muted)', strokeWidth: 2, strokeLinejoin: 'round' }} />
        <circle cx={x(values.length - 1)} cy={y(last)} r={4} className="d3ml-spark-dot" />
      </svg>
    </figure>
  );
}
