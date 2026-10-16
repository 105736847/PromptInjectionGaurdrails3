/**
 * StudentCard – a reusable component. It knows HOW to display a student;
 * the parent decides WHICH student by passing props:
 *
 *   <StudentCard name="Mia Nguyen" studentId="103456789" skills={['React']} isOnline />
 *
 * - Props are destructured right in the parameter list.
 * - `= value` gives a default when the parent leaves a prop out.
 * - Props are READ-ONLY: a component must never change its own props.
 */
export default function StudentCard({
  name,
  studentId,
  major = 'Undeclared major', // default value
  skills = [], // default: empty array, so skills.map() never crashes
  isOnline = false, // a boolean prop written as just `isOnline` means true
  accent = 'var(--chart-1)',
}) {
  // Derived from props – calculated fresh on every render.
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="card jsx-student">
      <header className="jsx-student-header">
        <span
          className="avatar"
          style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="jsx-student-name">
          <h4 className="m-0">{name}</h4>
          <span className="small muted mono">{studentId}</span>
        </div>
        <span className={`badge ${isOnline ? 'badge-success' : ''}`}>{isOnline ? '● Online' : '○ Offline'}</span>
      </header>

      <p className="small mt-1 mb-1">{major}</p>

      {skills.length > 0 ? (
        <ul className="jsx-skill-list" aria-label={`${name}'s skills`}>
          {skills.map((skill) => (
            <li key={skill} className="badge badge-primary">{skill}</li>
          ))}
        </ul>
      ) : (
        <p className="small subtle m-0">No skills listed yet</p>
      )}
    </article>
  );
}
