/**
 * jobKinds.js – the kinds of job the server knows (`JobKind` in backend/app/routers/jobs.py).
 * ONE list, used by the form in BackgroundJobs.jsx and by the title of every JobCard.
 */
export const JOB_KINDS = [
  { value: 'train-model', label: 'Train a model' },
  { value: 'generate-report', label: 'Generate a report' },
  { value: 'import-data', label: 'Import data' },
];

/** 'train-model' → 'Train a model'. A kind missing from the list is shown as it is. */
export function jobLabel(kind) {
  return JOB_KINDS.find((k) => k.value === kind)?.label ?? kind;
}
