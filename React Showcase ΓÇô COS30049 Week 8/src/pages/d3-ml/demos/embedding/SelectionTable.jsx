/**
 * SelectionTable – the LINKED table under the embedding scatter plot.
 * It only receives rows as props: the brush lives in the parent, so any
 * component can react to the same selection (one-way data flow).
 */
import { X } from 'lucide-react';
import { pct } from '../helpers/chart.js';

const MAX_ROWS = 40;

export default function SelectionTable({ rows, onClear, colors }) {
  if (rows.length === 0) {
    return <p className="small muted m-0">Switch to <strong>Brush to select</strong> and drag a rectangle – the URLs inside appear here.</p>;
  }
  const phishing = rows.filter((d) => d.label === 1).length;
  const wrong = rows.filter((d) => d.wrong).length;
  const sorted = [...rows].sort((a, b) => b.score - a.score).slice(0, MAX_ROWS);

  return (
    <section className="stack-sm" aria-label="Selected URLs">
      <div className="row-between">
        <p className="small m-0" aria-live="polite">
          <strong>{rows.length}</strong> selected · {phishing} phishing · <strong>{wrong}</strong> misclassified
        </p>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClear}><X size={14} /> Clear selection</button>
      </div>
      <div className="table-wrap d3ml-table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">URL</th>
              <th scope="col">True class</th>
              <th scope="col" className="num">Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr key={d.id}>
                <td className="mono small d3ml-url-cell">{d.url}</td>
                <td className="nowrap">
                  <span className="viz-swatch" style={{ background: colors[d.label], display: 'inline-block', marginRight: 6 }} />
                  {d.label ? 'Phishing' : 'Legitimate'}{d.wrong && <span className="badge badge-warning" style={{ marginLeft: 6 }}>wrong</span>}
                </td>
                <td className="num">{pct(d.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > MAX_ROWS && <p className="small subtle m-0">Showing the {MAX_ROWS} highest scores of {rows.length}.</p>}
    </section>
  );
}
