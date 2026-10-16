/**
 * ClusterSummary – the embedding scatter plot as a table (closed by default).
 * 1,000 dots would make a very long table, so it lists what the picture shows:
 * one row per cluster, with its true class, size and number of mistakes.
 */
import * as d3 from 'd3';
import { CLUSTERS, testSet } from '../data/phishingData.js';
import { pct } from '../helpers/chart.js';

// The data never changes, so the rows are computed ONCE, when the module loads.
const ROWS = CLUSTERS.map((c) => {
  const points = testSet.filter((d) => d.cluster === c.name);
  return {
    name: c.name,
    label: c.label,
    count: points.length,
    wrong: points.filter((d) => (d.score >= 0.5 ? 1 : 0) !== d.label).length,
    meanScore: d3.mean(points, (d) => d.score),
  };
});

export default function ClusterSummary({ colors }) {
  return (
    <details className="d3ml-details">
      <summary>Show data table</summary>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Cluster</th>
              <th scope="col">True class</th>
              <th scope="col" className="num">URLs</th>
              <th scope="col" className="num">Misclassified</th>
              <th scope="col" className="num">Mean score</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
                <td className="nowrap">
                  <span className="viz-swatch" style={{ background: colors[r.label], display: 'inline-block', marginRight: 6, borderRadius: '50%' }} />
                  {r.label ? 'Phishing' : 'Legitimate'}
                </td>
                <td className="num">{r.count}</td>
                <td className="num">{r.wrong}</td>
                <td className="num">{pct(r.meanScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
