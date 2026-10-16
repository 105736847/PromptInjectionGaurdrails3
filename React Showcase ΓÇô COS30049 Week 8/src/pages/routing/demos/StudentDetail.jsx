/**
 * StudentDetail – the route "/routing/students/:studentId".
 *
 * `:studentId` is a URL parameter: useParams() returns it as a STRING
 * (e.g. { studentId: "3" }). Always handle ids that don't exist.
 */
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Info, UserX } from 'lucide-react';
import { students, getStudentById } from '../../../data/students.js';

export default function StudentDetail() {
  const { studentId } = useParams();
  const location = useLocation();
  const student = getStudentById(studentId); // converts the string to a number inside

  if (!student) {
    return (
      <section className="routing-empty">
        <UserX size={32} aria-hidden="true" />
        <h4 className="m-0">No student with id “{studentId}”</h4>
        <Link to="/routing" className="btn btn-sm">
          Back to the directory
        </Link>
      </section>
    );
  }

  const index = students.indexOf(student);
  const previous = students[index - 1]; // undefined for the first student
  const next = students[index + 1]; // undefined for the last student

  return (
    <article className="stack">
      {/* Optional data passed with navigate(url, { state }) – see the playground below */}
      {location.state?.note && (
        <p className="alert alert-info m-0">
          <Info size={18} /> {location.state.note}
        </p>
      )}

      <header className="row">
        <span className="avatar" aria-hidden="true">
          {student.firstName[0]}
          {student.lastName[0]}
        </span>
        <div>
          <h4 className="m-0">
            {student.firstName} {student.lastName}
          </h4>
          <span className="small muted mono">{student.studentId}</span>
        </div>
      </header>

      <dl className="routing-facts">
        <dt>Major</dt>
        <dd>{student.major}</dd>
        <dt>Campus</dt>
        <dd>{student.campus}</dd>
        <dt>Year</dt>
        <dd>{student.year}</dd>
        <dt>Score</dt>
        <dd>
          {student.score} ({student.grade})
        </dd>
      </dl>

      <nav className="row-between" aria-label="Previous and next student">
        {previous ? (
          <Link className="btn btn-sm" to={`/routing/students/${previous.id}`}>
            <ChevronLeft size={15} /> {previous.firstName}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link className="btn btn-sm" to={`/routing/students/${next.id}`}>
            {next.firstName} <ChevronRight size={15} />
          </Link>
        )}
      </nav>
    </article>
  );
}
