/**
 * SequenceDiagram – a UML-style sequence diagram drawn with plain SVG + JSX.
 * Columns are the actors (vertical "lifelines"), rows are the steps, and time
 * runs from top to bottom. Solid arrow = a call, dashed arrow = the answer.
 *
 * A pure component: it draws what the props say (step, skipped) and reports
 * clicks (onSelect). The width comes from useElementSize, so it fits any screen.
 */
import useElementSize from '../../../hooks/useElementSize.js';
import { ACTORS, STEPS } from './flowSteps.js';

const HEAD = 48; // height of the actor boxes area
const ROW = 42; // height of one step
const GUTTER = 28; // left column for the step numbers

/** Arrow head whose tip touches (x, y); dir = +1 points right, -1 points left. */
function Head({ x, y, dir }) {
  return <path className="crud-seq-head" d={`M${x},${y}l${-7 * dir},-4.5v9z`} />;
}

function Arrow({ step, y, xOf, showTag }) {
  const x1 = xOf(step.from);
  const x2 = xOf(step.to);
  const dir = Math.sign(x2 - x1);
  const tag = (x, ty, anchor = 'middle') =>
    showTag && <text className="crud-seq-tag" x={x} y={ty} textAnchor={anchor}>{step.tag}</text>;

  if (step.kind === 'self') {
    return (
      <>
        <path className="crud-seq-line" d={`M${x1},${y - 8}h24v16h-18`} />
        <Head x={x1} y={y + 8} dir={-1} />
        {tag(x1 + 30, y + 4, 'start')}
      </>
    );
  }
  if (step.kind === 'roundtrip') {
    return (
      <>
        <line className="crud-seq-line" x1={x1} x2={x2 - 6 * dir} y1={y - 6} y2={y - 6} />
        <Head x={x2} y={y - 6} dir={dir} />
        <line className="crud-seq-line crud-seq-dashed" x1={x2} x2={x1 + 6 * dir} y1={y + 7} y2={y + 7} />
        <Head x={x1} y={y + 7} dir={-dir} />
        {tag((x1 + x2) / 2, y - 11)}
      </>
    );
  }
  return (
    <>
      <line className={`crud-seq-line ${step.kind === 'return' ? 'crud-seq-dashed' : ''}`} x1={x1} x2={x2 - 6 * dir} y1={y} y2={y} />
      <Head x={x2} y={y} dir={dir} />
      {tag((x1 + x2) / 2, y - 6)}
    </>
  );
}

export default function SequenceDiagram({ step, skipped, onSelect }) {
  const [ref, { width }] = useElementSize();
  const height = HEAD + STEPS.length * ROW + 6;
  const boxW = Math.min(96, (width - GUTTER) / ACTORS.length - 6);
  const span = (width - GUTTER - boxW) / (ACTORS.length - 1);
  const xOf = (id) => GUTTER + boxW / 2 + ACTORS.findIndex((a) => a.id === id) * span;

  return (
    <div ref={ref} className="crud-seq">
      {width > 0 && (
        <svg width={width} height={height} role="group" aria-label="Sequence diagram: one request from React to SQLite and back">
          {ACTORS.map((actor) => (
            <g key={actor.id} aria-hidden="true">
              <line className="crud-seq-lifeline" x1={xOf(actor.id)} x2={xOf(actor.id)} y1={34} y2={height} />
              <rect className="crud-seq-actor" x={xOf(actor.id) - boxW / 2} y={4} width={boxW} height={30} rx={7} />
              <text className="crud-seq-actor-label" x={xOf(actor.id)} y={19} dy="0.35em" textAnchor="middle"
                style={{ fontSize: boxW < 62 ? 10 : undefined }}>{actor.label}</text>
            </g>
          ))}

          {STEPS.map((s, i) => {
            const y = HEAD + i * ROW + ROW / 2;
            const state = skipped.has(i) ? 'is-skipped' : i === step ? 'is-active' : i < step ? 'is-done' : 'is-next';
            return (
              <g
                key={s.title}
                className={`crud-seq-step ${state}`}
                role="button"
                tabIndex={0}
                aria-pressed={i === step}
                aria-label={`Step ${i + 1}: ${s.title}${skipped.has(i) ? ' (skipped in this run)' : ''}`}
                onClick={() => onSelect(i)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); // Space would scroll the page
                    onSelect(i);
                  }
                }}
              >
                {/* full-width band = a big, easy click target (and the highlight) */}
                <rect className="crud-seq-band" x={0} y={y - ROW / 2 + 1} width={width} height={ROW - 2} rx={8} />
                <circle className="crud-seq-num" cx={13} cy={y} r={10} />
                <text className="crud-seq-num-label" x={13} y={y} dy="0.35em" textAnchor="middle">{i + 1}</text>
                <Arrow step={s} y={y} xOf={xOf} showTag={width >= 460} />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
