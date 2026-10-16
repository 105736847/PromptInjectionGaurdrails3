/**
 * <figure> + <figcaption>: self-contained content with a caption.
 *
 * A figure is not only for photos – a chart, a diagram or a code listing
 * that is referred to from the main text ("see Figure 2") is a figure too.
 * <figcaption> must be the first or last child of <figure>.
 */
const commits = [
  { week: 'W5', count: 12 },
  { week: 'W6', count: 19 },
  { week: 'W7', count: 27 },
  { week: 'W8', count: 41 },
];
const max = Math.max(...commits.map((c) => c.count));

const snippet = `const [prediction, setPrediction] = useState(null);`;

export default function Figures() {
  return (
    <div className="grid-3">
      <figure className="card m-0 stack-sm">
        <img
          src="https://picsum.photos/seed/cos30049-team/600/400"
          alt="Placeholder photo standing in for a sprint-planning photo"
          width={600}
          height={400}
          loading="lazy"
          style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-sm)' }}
        />
        <figcaption className="small muted">
          <strong>Figure 1.</strong> Sprint planning. <small>Photo: picsum.photos (placeholder)</small>
        </figcaption>
      </figure>

      <figure className="card m-0 stack-sm">
        {/* An inline SVG chart; role="img" + aria-label summarise it for screen readers */}
        <svg viewBox="0 0 200 120" role="img" aria-label="Bar chart: commits rose from 12 in week 5 to 41 in week 8">
          {commits.map((c, i) => {
            const h = (c.count / max) * 90;
            return (
              <g key={c.week}>
                <rect x={15 + i * 47} y={100 - h} width="30" height={h} rx="3" style={{ fill: 'var(--chart-1)' }} />
                <text x={30 + i * 47} y="114" textAnchor="middle" fontSize="9" style={{ fill: 'var(--color-text-muted)' }}>
                  {c.week}
                </text>
                <text x={30 + i * 47} y={96 - h} textAnchor="middle" fontSize="9" style={{ fill: 'var(--color-text)' }}>
                  {c.count}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption className="small muted">
          <strong>Figure 2.</strong> Git commits per week.
        </figcaption>
      </figure>

      <figure className="card m-0 stack-sm">
        <pre className="demo-output m-0">
          <code>{snippet}</code>
        </pre>
        <figcaption className="small muted">
          <strong>Listing 1.</strong> Storing the model’s prediction in state.
        </figcaption>
      </figure>
    </div>
  );
}
