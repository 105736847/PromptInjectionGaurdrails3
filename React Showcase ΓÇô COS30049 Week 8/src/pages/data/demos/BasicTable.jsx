/**
 * BasicTable – the simplest way to show data: map() every object to a <tr>.
 *
 * - Every row needs a stable, unique `key` (use the id, not the array index).
 * - Sort a COPY of the array: sort() changes the original, and imported
 *   data, props and state must never be changed in place.
 * - The footer total is computed with reduce() while rendering.
 */
import { students } from '../../../data/students.js';
import GradeBadge from './GradeBadge.jsx';

// Date-only strings ("2024-09-08") are parsed as UTC midnight, so format them in UTC too.
const dateFormat = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function BasicTable() {
  // [...students] makes a shallow copy, so the shared array keeps its order.
  const topStudents = [...students].sort((a, b) => b.score - a.score).slice(0, 6);
  const average = topStudents.reduce((sum, s) => sum + s.score, 0) / topStudents.length;

  return (
    <div className="table-wrap">
      <table className="table">
        <caption>Top 6 students by score</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Major</th>
            <th scope="col">Enrolled</th>
            <th scope="col" className="num">Score</th>
            <th scope="col">Grade</th>
          </tr>
        </thead>
        <tbody>
          {topStudents.map((student, index) => (
            <tr key={student.id}>
              <td className="muted">{index + 1}</td>
              <th scope="row">
                {student.firstName} {student.lastName}
              </th>
              <td>{student.major}</td>
              <td>
                {/* <time> gives the machine-readable date; the text is for humans */}
                <time dateTime={student.enrolled}>{dateFormat.format(new Date(student.enrolled))}</time>
              </td>
              <td className="num">{student.score}</td>
              <td>
                <GradeBadge grade={student.grade} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={4}>
              Average of the top 6
            </th>
            <td className="num">{average.toFixed(1)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
