/**
 * GradeBadge – a small coloured label for a grade.
 * A lookup object maps each grade to a CSS class, which is much tidier than a
 * chain of if/else or nested ternaries inside JSX.
 */
const GRADE_CLASSES = {
  HD: 'badge-success',
  D: 'badge-info',
  C: 'badge-primary',
  P: 'badge-warning',
  N: 'badge-danger',
};

export const GRADE_NAMES = {
  HD: 'High Distinction',
  D: 'Distinction',
  C: 'Credit',
  P: 'Pass',
  N: 'Fail',
};

export default function GradeBadge({ grade }) {
  return (
    // The colour is a bonus – the text itself ("HD") carries the meaning.
    <span className={`badge ${GRADE_CLASSES[grade] ?? ''}`} title={GRADE_NAMES[grade]}>
      {grade}
    </span>
  );
}
