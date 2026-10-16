/**
 * DataTable – the "Show data table" twin under a chart (closed until you open it).
 * Tooltips enhance, they never gate: every value is also readable here – with a
 * keyboard, a screen reader or no mouse at all.
 *
 *   <DataTable caption="Monthly averages" columns={['Week', 'Cloud', 'UX']} rows={[['W1', 52, 30], ['W2', 61, 28]]} />
 *
 * The first cell of each row is its header (and its React key, so keep it unique);
 * the other cells are right-aligned numbers. `caption` (optional) says what the rows are.
 */
export default function DataTable({ caption, columns, rows }) {
  return (
    <details className="d3c-details">
      <summary>Show data table</summary>
      <div className="table-wrap">
        <table className="table">
          {caption && <caption>{caption}</caption>}
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th key={column} scope="col" className={i === 0 ? undefined : 'num'}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([header, ...cells]) => (
              <tr key={header}>
                <th scope="row" className="nowrap">{header}</th>
                {cells.map((value, i) => (
                  <td key={columns[i + 1]} className="num">{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
