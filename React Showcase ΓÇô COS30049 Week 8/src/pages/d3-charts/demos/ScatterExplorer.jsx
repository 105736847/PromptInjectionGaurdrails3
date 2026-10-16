/**
 * ScatterExplorer – a linked view: brush dots in the chart → those students appear in the table.
 * Pattern: D3 owns the <g> (inside ScatterPlot.jsx). This parent only holds the lifted state:
 * the selection is "lifted up" into this parent, because two siblings need it:
 * <ScatterPlot> writes it (through onSelect) and the table below reads it.
 * We pass the state setter itself as onSelect – its identity never changes, so the
 * chart's effect does not re-run on every render.
 */
import { useState } from 'react';
import * as d3 from 'd3';
import { SquareDashedMousePointer } from 'lucide-react';
import ScatterPlot from './ScatterPlot.jsx';
import DataTable from './helpers/DataTable.jsx';
import { cohort } from './data/cohort.js';
import { linearFit } from './helpers/chartKit.js';

const fit = linearFit(cohort, (d) => d.hours, (d) => d.score); // computed once, outside React
const SHOW = 8; // rows shown in the table
// Every student is also readable without a mouse (hover and brush both need a pointer).
const ALL_ROWS = [...cohort].sort((a, b) => b.score - a.score)
  .map((d) => [d.name, d.campus, d.hours, `${d.attendance} %`, d.score]);

export default function ScatterExplorer() {
  const [selected, setSelected] = useState([]);
  const rows = [...selected].sort((a, b) => b.score - a.score); // sort a COPY, never state itself
  const average = (key) => d3.mean(selected, (d) => d[key]).toFixed(1);

  return (
    <div className="stack">
      <ScatterPlot students={cohort} fit={fit} onSelect={setSelected} />
      <p className="small muted m-0">
        Trend line: each extra weekly study hour goes with about <strong>{fit.slope.toFixed(1)} more points</strong>{' '}
        (r = {fit.r.toFixed(2)}). That is a correlation – it does not prove that studying more <em>causes</em> the higher score.
      </p>

      <section aria-live="polite">
        {selected.length === 0 ? (
          <div className="alert alert-info">
            <SquareDashedMousePointer size={18} aria-hidden="true" />
            <div>Choose <strong>Brush select</strong> and drag a rectangle over the dots – or press a <strong>Quick select</strong> button – to list those students here.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption>
                {selected.length} students selected · average score {average('score')} · {average('hours')} h study per week · {average('attendance')} % attendance
              </caption>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Campus</th>
                  <th scope="col" className="num">Hours / week</th>
                  <th scope="col" className="num">Attendance</th>
                  <th scope="col" className="num">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, SHOW).map((d) => (
                  <tr key={d.id}>
                    <th scope="row" className="nowrap">{d.name}</th>
                    <td>{d.campus}</td>
                    <td className="num">{d.hours}</td>
                    <td className="num">{d.attendance} %</td>
                    <td className="num">{d.score}</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > SHOW && (
                <tfoot>
                  <tr>
                    <td colSpan={5} className="muted">…and {rows.length - SHOW} more (highest scores shown first)</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>
      <DataTable
        caption={`All ${cohort.length} students, highest score first`}
        columns={['Student', 'Campus', 'Hours / week', 'Attendance', 'Score']}
        rows={ALL_ROWS}
      />
    </div>
  );
}
