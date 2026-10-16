/**
 * activities.js – how an average (fictional) student spends their study hours each week.
 * Written out by hand so you can see the story: assignments spike before the deadlines in
 * weeks 6 and 11, lectures stop in the break (week 7), revision takes over at the end.
 * SV = study vacation, E1/E2 = exam weeks.
 */
export const ACTIVITIES = [
  { key: 'lectures', label: 'Lectures', color: 'var(--chart-1)' },
  { key: 'labs', label: 'Labs & tutorials', color: 'var(--chart-2)' },
  { key: 'reading', label: 'Reading', color: 'var(--chart-3)' },
  { key: 'assignments', label: 'Assignments', color: 'var(--chart-4)' },
  { key: 'revision', label: 'Exam revision', color: 'var(--chart-5)' },
];

export const activityWeeks = [
  { week: '1', lectures: 3, labs: 0.5, reading: 3, assignments: 1, revision: 0 },
  { week: '2', lectures: 3, labs: 2, reading: 2.8, assignments: 1.5, revision: 0 },
  { week: '3', lectures: 3, labs: 2, reading: 2.6, assignments: 2.5, revision: 0 },
  { week: '4', lectures: 3, labs: 2, reading: 2.4, assignments: 4, revision: 0 },
  { week: '5', lectures: 3, labs: 2, reading: 2, assignments: 6.5, revision: 0.3 },
  { week: '6', lectures: 3, labs: 2, reading: 1.6, assignments: 9, revision: 0.5 },
  { week: '7', lectures: 0, labs: 0, reading: 1.5, assignments: 2, revision: 1 },
  { week: '8', lectures: 3, labs: 2, reading: 2.2, assignments: 2.5, revision: 0.5 },
  { week: '9', lectures: 3, labs: 2, reading: 2, assignments: 4, revision: 0.8 },
  { week: '10', lectures: 3, labs: 2, reading: 1.8, assignments: 7, revision: 1.2 },
  { week: '11', lectures: 3, labs: 2, reading: 1.4, assignments: 10.5, revision: 1.5 },
  { week: '12', lectures: 2.5, labs: 1.5, reading: 1.2, assignments: 5, revision: 3 },
  { week: 'SV', lectures: 0, labs: 0, reading: 1, assignments: 1, revision: 12 },
  { week: 'E1', lectures: 0, labs: 0, reading: 0.5, assignments: 0, revision: 15 },
  { week: 'E2', lectures: 0, labs: 0, reading: 0.3, assignments: 0, revision: 9 },
];
