/**
 * GroupedList – turn a flat array into groups (by campus, major or year) and
 * show each group as a collapsible section with a count and an average.
 *
 * reduce() builds an object like { Hawthorn: [...], Online: [...] }.
 * Which groups are collapsed is state; the groups themselves are derived.
 */
import { useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { students } from '../../../data/students.js';
import GradeBadge from './GradeBadge.jsx';

const GROUP_BY_OPTIONS = { campus: 'Campus', major: 'Major', year: 'Year of study' };

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const groupName = key === 'year' ? `Year ${item.year}` : item[key];
    (groups[groupName] ??= []).push(item); // create the array the first time we see this group
    return groups;
  }, {});
}

export default function GroupedList() {
  const [groupKey, setGroupKey] = useState('campus');
  const [collapsed, setCollapsed] = useState(() => new Set()); // names of the closed groups
  const baseId = useId();

  const groups = Object.entries(groupBy(students, groupKey)).sort(([a], [b]) => a.localeCompare(b));

  function toggleGroup(name) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function changeGrouping(key) {
    setGroupKey(key);
    setCollapsed(new Set()); // the old group names mean nothing now – reset in the handler
  }

  return (
    <div className="stack">
      <div className="row-between">
        <label className="row small">
          Group by
          <select className="input data-inline-select" value={groupKey} onChange={(e) => changeGrouping(e.target.value)}>
            {Object.entries(GROUP_BY_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCollapsed(new Set())}>
            Expand all
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setCollapsed(new Set(groups.map(([name]) => name)))}
          >
            Collapse all
          </button>
        </div>
      </div>

      {groups.map(([name, members], index) => {
        const isOpen = !collapsed.has(name);
        const panelId = `${baseId}-group-${index}`;
        const average = members.reduce((sum, s) => sum + s.score, 0) / members.length;
        return (
          <section key={name} className="data-group">
            <h4 className="m-0">
              <button
                type="button"
                className="data-group-header"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleGroup(name)}
              >
                <ChevronRight size={16} className={isOpen ? 'data-rotated' : ''} aria-hidden="true" />
                <span>{name}</span>
                <span className="badge">{members.length} students</span>
                <span className="small muted data-group-average">avg {average.toFixed(1)}</span>
              </button>
            </h4>
            <ul id={panelId} className="data-group-list" hidden={!isOpen}>
              {members.map((s) => (
                <li key={s.id}>
                  <span>
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="row">
                    <span className="small muted">{s.score}</span>
                    <GradeBadge grade={s.grade} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
