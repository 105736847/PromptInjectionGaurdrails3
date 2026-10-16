/**
 * CampusReport – an ordinary component. Only the WAY it is imported
 * (with lazy() in LazyRouteDemo.jsx) puts it into its own JavaScript file.
 */
import { students } from '../../../data/students.js';

export default function CampusReport() {
  const byCampus = students.reduce((acc, s) => {
    acc[s.campus] = (acc[s.campus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card card-subtle">
      <h4 className="card-title">Campus report</h4>
      <ul className="routing-link-list">
        {Object.entries(byCampus).map(([campus, count]) => (
          <li key={campus}>
            {campus}: <strong>{count}</strong> students
          </li>
        ))}
      </ul>
    </div>
  );
}
