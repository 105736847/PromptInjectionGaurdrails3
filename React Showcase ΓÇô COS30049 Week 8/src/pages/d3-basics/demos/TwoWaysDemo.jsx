/**
 * TwoWaysDemo – the SAME bar chart built twice, side by side.
 * Pattern: mixed – one chart per pattern, so you can compare them line by line.
 *
 *   A. BarsReactRenders.jsx – D3 calculates, React renders (JSX + CSS transitions)
 *   B. BarsD3Owns.jsx       – D3 owns the <g> (useRef + useEffect + selection.join)
 *
 * This parent owns the state (data + sort order) and passes the same array to
 * both charts as a prop. Click the buttons and compare: the result looks the
 * same – what differs is WHO creates and updates the SVG elements.
 */
import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Shuffle } from 'lucide-react';
import BarsReactRenders from './BarsReactRenders.jsx';
import BarsD3Owns from './BarsD3Owns.jsx';
import { makeEnrolments } from './data/unitEnrolments.js';

export default function TwoWaysDemo() {
  const [data, setData] = useState(makeEnrolments); // pass the function: runs only on the first render
  const [sortByValue, setSortByValue] = useState(false);

  // Derived data: sort a COPY (never mutate state). Both charts get this array.
  const shown = useMemo(
    () => (sortByValue ? [...data].sort((a, b) => d3.descending(a.students, b.students)) : data),
    [data, sortByValue],
  );

  return (
    <div className="stack">
      <div className="viz-controls">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setData(makeEnrolments())}>
          <Shuffle size={15} aria-hidden="true" /> New random data
        </button>
        <label className="switch">
          <input type="checkbox" checked={sortByValue} onChange={(e) => setSortByValue(e.target.checked)} />
          <span className="switch-track" />
          Sort by students
        </label>
      </div>

      <p className="small m-0">
        <strong>Students enrolled per unit</strong> <span className="muted">(fictional) – both charts draw the same array</span>
      </p>
      <div className="grid-2 d3-basics-twin">
        <figure className="d3-basics-figure">
          <figcaption>
            <span className="badge badge-primary">A</span> D3 calculates, React renders
            <span className="d3-basics-figure-sub">Scales + JSX + CSS transitions</span>
          </figcaption>
          <BarsReactRenders data={shown} />
        </figure>
        <figure className="d3-basics-figure">
          <figcaption>
            <span className="badge badge-primary">B</span> D3 owns the &lt;g&gt;
            <span className="d3-basics-figure-sub">useRef + useEffect + join() + transition()</span>
          </figcaption>
          <BarsD3Owns data={shown} />
        </figure>
      </div>

      {/* Tooltips enhance, never gate: the same numbers as a real table */}
      <details className="d3-basics-details">
        <summary>Show data table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption>Students per unit (fictional)</caption>
            <thead>
              <tr>
                <th scope="col">Unit</th>
                <th scope="col" className="num">Students</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.unit}>
                  <th scope="row">{d.unit}</th>
                  <td className="num">{d.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
