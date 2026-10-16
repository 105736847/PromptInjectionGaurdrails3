/**
 * ForceGraphParts – the plain React pieces around ForceGraph.jsx: the search
 * form, a labelled slider, the tooltip content and the data table. They only
 * receive props and call callbacks – there is no D3 in this file.
 */
import { useId } from 'react';
import { Search } from 'lucide-react';
import { TooltipRow } from './ChartTooltip.jsx';
import { units, prerequisites, walk } from '../data/prerequisites.js';

/** "1 unit", "3 units" – never "1 units". */
const unitCount = (n) => `${n} ${n === 1 ? 'unit' : 'units'}`;

/** What the tooltip says about one unit (a node of the graph). */
export function UnitTooltipContent({ unit }) {
  return (
    <>
      <div className="viz-tooltip-title">{unit.id} · {unit.name}</div>
      <TooltipRow color={`var(--chart-${unit.year})`} keyClass="d3-networks-dot" label="Year level" value={unit.year} />
      <TooltipRow label="Needs first" value={unitCount(walk(unit.id, 'up').size)} />
      <TooltipRow label="Unlocks" value={unitCount(walk(unit.id, 'down').size)} />
    </>
  );
}

export function UnitSearch({ query, notFound, onQueryChange, onSubmit }) {
  const id = useId();
  return (
    <form className="d3-networks-search" role="search" onSubmit={onSubmit}>
      <label className="visually-hidden" htmlFor={`${id}-q`}>Find a unit</label>
      {/* <datalist> gives the text box native autocomplete suggestions */}
      <input id={`${id}-q`} className="input" list={`${id}-units`} placeholder="Find a unit, e.g. Machine"
        value={query} aria-invalid={notFound} onChange={(e) => onQueryChange(e.target.value)} />
      <datalist id={`${id}-units`}>
        {units.map((u) => <option key={u.id} value={`${u.id} ${u.name}`} />)}
      </datalist>
      <button type="submit" className="btn btn-secondary btn-sm"><Search size={15} aria-hidden="true" />Find</button>
    </form>
  );
}

export function Slider({ label, value, onChange, min, max, step, prefix = '' }) {
  return (
    <label className="d3-networks-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output className="mono small">{prefix}{value}</output>
    </label>
  );
}

export function PrerequisiteTable() {
  return (
    <details className="mt-1">
      <summary className="small">Show data table</summary>
      <div className="table-wrap mt-1">
        <table className="table">
          <caption>Every unit and its direct prerequisites</caption>
          <thead><tr><th scope="col">Unit</th><th scope="col">Year</th><th scope="col">Prerequisites</th></tr></thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id}>
                <th scope="row">{u.id} {u.name}</th>
                <td>{u.year}</td>
                <td>{prerequisites.filter((l) => l.target === u.id).map((l) => l.source).join(', ') || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
