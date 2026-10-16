/**
 * StudentList – ONE component definition, used many times with different props.
 *
 * Props look like HTML attributes, but they can hold any JavaScript value:
 * strings, numbers, booleans, arrays, objects – even functions.
 */
import StudentCard from './StudentCard.jsx';

export default function StudentList() {
  return (
    <div className="grid-auto">
      <StudentCard
        name="Mia Nguyen"
        studentId="103456789"
        major="Software Development"
        skills={['React', 'Python', 'FastAPI']} // arrays go inside { }
        isOnline // same as isOnline={true}
      />
      <StudentCard
        name="Liam O'Connor"
        studentId="104112233"
        major="Data Science"
        skills={['pandas', 'scikit-learn']}
        accent="var(--chart-2)"
      />
      <StudentCard
        name="Aisha Rahman"
        studentId="102998877"
        isOnline
        accent="var(--chart-4)"
        // no major and no skills → the defaults in StudentCard are used
      />
    </div>
  );
}
