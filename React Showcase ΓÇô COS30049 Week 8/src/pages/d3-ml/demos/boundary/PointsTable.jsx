/**
 * PointsTable – the training points as a table: the plot's text alternative.
 *
 * memo(): while training, the parent re-renders every animation frame – but
 * these rows only depend on `points`, so React skips this component until the
 * points array itself changes (a new point, another dataset).
 */
import { memo } from 'react';

const fmt = (v) => v.toFixed(2).replace('-', '−'); // a real minus sign lines up better

function PointsTable({ points }) {
  const classB = points.filter((p) => p.label === 1).length;
  return (
    <details className="d3ml-details">
      <summary>Show data table</summary>
      <div className="table-wrap d3ml-table-scroll">
        <table className="table">
          <caption className="small muted">{points.length} points · class A {points.length - classB} · class B {classB}</caption>
          <thead>
            <tr>
              <th scope="col" className="num">#</th>
              <th scope="col" className="num">x</th>
              <th scope="col" className="num">y</th>
              <th scope="col">Class</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              // Points are only ever appended or replaced as a whole, so the index is a stable key.
              <tr key={i}>
                <td className="num">{i + 1}</td>
                <td className="num">{fmt(p.x)}</td>
                <td className="num">{fmt(p.y)}</td>
                <td>{p.label ? 'B' : 'A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default memo(PointsTable);
