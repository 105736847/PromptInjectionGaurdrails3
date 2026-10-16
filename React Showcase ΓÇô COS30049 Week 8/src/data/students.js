/**
 * students.js – mock data used by the Data Display and React Router pages.
 *
 * In a real project this would come from a back-end API (e.g. your FastAPI
 * server) – see the "Fetching Data" page. The names are fictional.
 */
export const students = [
  { id: 1, studentId: '104338601', firstName: 'Olivia', lastName: 'Nguyen', email: 'olivia.nguyen@student.example.edu', major: 'Artificial Intelligence', campus: 'Sarawak', year: 2, score: 38, grade: 'N', status: 'At risk', enrolled: '2024-09-08' },
  { id: 2, studentId: '104810489', firstName: 'Liam', lastName: 'Smith', email: 'liam.smith@student.example.edu', major: 'Software Development', campus: 'Hawthorn', year: 2, score: 69, grade: 'C', status: 'Active', enrolled: '2024-04-03' },
  { id: 3, studentId: '104480969', firstName: 'Mia', lastName: 'Chen', email: 'mia.chen@student.example.edu', major: 'Internet of Things', campus: 'Online', year: 1, score: 53, grade: 'P', status: 'Active', enrolled: '2025-04-03' },
  { id: 4, studentId: '104418136', firstName: 'Noah', lastName: 'Patel', email: 'noah.patel@student.example.edu', major: 'Software Development', campus: 'Hawthorn', year: 2, score: 43, grade: 'N', status: 'At risk', enrolled: '2024-02-24' },
  { id: 5, studentId: '104707252', firstName: 'Ava', lastName: 'Williams', email: 'ava.williams@student.example.edu', major: 'Software Development', campus: 'Online', year: 1, score: 52, grade: 'P', status: 'Active', enrolled: '2025-01-27' },
  { id: 6, studentId: '104576849', firstName: 'Ethan', lastName: 'Brown', email: 'ethan.brown@student.example.edu', major: 'Cybersecurity', campus: 'Hawthorn', year: 2, score: 75, grade: 'D', status: 'Active', enrolled: '2024-05-08' },
  { id: 7, studentId: '104058260', firstName: 'Chloe', lastName: 'Kim', email: 'chloe.kim@student.example.edu', major: 'Internet of Things', campus: 'Hawthorn', year: 1, score: 70, grade: 'D', status: 'Active', enrolled: '2025-06-09' },
  { id: 8, studentId: '104168066', firstName: 'Lucas', lastName: 'Singh', email: 'lucas.singh@student.example.edu', major: 'Software Development', campus: 'Sarawak', year: 3, score: 43, grade: 'N', status: 'At risk', enrolled: '2023-06-19' },
  { id: 9, studentId: '104160262', firstName: 'Grace', lastName: 'Wilson', email: 'grace.wilson@student.example.edu', major: 'Internet of Things', campus: 'Sarawak', year: 3, score: 49, grade: 'N', status: 'Active', enrolled: '2023-05-12' },
  { id: 10, studentId: '104342298', firstName: 'Jack', lastName: 'Taylor', email: 'jack.taylor@student.example.edu', major: 'Cybersecurity', campus: 'Hawthorn', year: 1, score: 44, grade: 'N', status: 'At risk', enrolled: '2025-02-18' },
  { id: 11, studentId: '104238810', firstName: 'Isla', lastName: 'Wang', email: 'isla.wang@student.example.edu', major: 'Data Science', campus: 'Sarawak', year: 1, score: 69, grade: 'C', status: 'Active', enrolled: '2025-12-10' },
  { id: 12, studentId: '104288029', firstName: 'Leo', lastName: 'Martin', email: 'leo.martin@student.example.edu', major: 'Data Science', campus: 'Sarawak', year: 2, score: 66, grade: 'C', status: 'Active', enrolled: '2024-12-13' },
  { id: 13, studentId: '104309101', firstName: 'Zara', lastName: 'Lee', email: 'zara.lee@student.example.edu', major: 'Cybersecurity', campus: 'Hawthorn', year: 2, score: 83, grade: 'HD', status: 'Active', enrolled: '2024-10-15' },
  { id: 14, studentId: '104008551', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@student.example.edu', major: 'Data Science', campus: 'Hawthorn', year: 2, score: 72, grade: 'D', status: 'Active', enrolled: '2024-01-14' },
  { id: 15, studentId: '104369876', firstName: 'Mei', lastName: 'Tanaka', email: 'mei.tanaka@student.example.edu', major: 'Cybersecurity', campus: 'Hawthorn', year: 3, score: 65, grade: 'C', status: 'Active', enrolled: '2023-02-12' },
  { id: 16, studentId: '104479431', firstName: 'Hiroshi', lastName: 'Garcia', email: 'hiroshi.garcia@student.example.edu', major: 'Artificial Intelligence', campus: 'Hawthorn', year: 3, score: 81, grade: 'HD', status: 'Active', enrolled: '2023-01-13' },
  { id: 17, studentId: '104302994', firstName: 'Priya', lastName: 'Rossi', email: 'priya.rossi@student.example.edu', major: 'Cybersecurity', campus: 'Hawthorn', year: 3, score: 46, grade: 'N', status: 'Active', enrolled: '2023-05-03' },
  { id: 18, studentId: '104176747', firstName: 'Mateo', lastName: 'Ali', email: 'mateo.ali@student.example.edu', major: 'Data Science', campus: 'Hawthorn', year: 2, score: 57, grade: 'P', status: 'Active', enrolled: '2024-03-08' },
  { id: 19, studentId: '104151380', firstName: 'Sofia', lastName: 'Jones', email: 'sofia.jones@student.example.edu', major: 'Internet of Things', campus: 'Online', year: 1, score: 85, grade: 'HD', status: 'Active', enrolled: '2025-05-07' },
  { id: 20, studentId: '104350821', firstName: 'Arjun', lastName: 'Tran', email: 'arjun.tran@student.example.edu', major: 'Software Development', campus: 'Hawthorn', year: 2, score: 73, grade: 'D', status: 'Active', enrolled: '2024-06-10' },
  { id: 21, studentId: '104009122', firstName: 'Emily', lastName: 'Kelly', email: 'emily.kelly@student.example.edu', major: 'Cybersecurity', campus: 'Hawthorn', year: 2, score: 57, grade: 'P', status: 'Active', enrolled: '2024-02-20' },
  { id: 22, studentId: '104209832', firstName: 'Daniel', lastName: 'Murphy', email: 'daniel.murphy@student.example.edu', major: 'Software Development', campus: 'Hawthorn', year: 3, score: 50, grade: 'P', status: 'Active', enrolled: '2023-11-27' },
  { id: 23, studentId: '104607133', firstName: 'Ruby', lastName: 'Zhang', email: 'ruby.zhang@student.example.edu', major: 'Internet of Things', campus: 'Hawthorn', year: 3, score: 90, grade: 'HD', status: 'Active', enrolled: '2023-12-10' },
  { id: 24, studentId: '104036388', firstName: 'Kai', lastName: 'Walker', email: 'kai.walker@student.example.edu', major: 'Software Development', campus: 'Hawthorn', year: 3, score: 79, grade: 'D', status: 'Active', enrolled: '2023-12-04' },
  { id: 25, studentId: '104303823', firstName: 'Hannah', lastName: 'Hall', email: 'hannah.hall@student.example.edu', major: 'Data Science', campus: 'Hawthorn', year: 1, score: 68, grade: 'C', status: 'Active', enrolled: '2025-10-07' },
  { id: 26, studentId: '104443410', firstName: 'Omar', lastName: 'Hassan', email: 'omar.hassan@student.example.edu', major: 'Software Development', campus: 'Hawthorn', year: 2, score: 95, grade: 'HD', status: 'Active', enrolled: '2024-06-18' },
  { id: 27, studentId: '104350276', firstName: 'Lily', lastName: 'Li', email: 'lily.li@student.example.edu', major: 'Cybersecurity', campus: 'Sarawak', year: 1, score: 83, grade: 'HD', status: 'Active', enrolled: '2025-07-17' },
  { id: 28, studentId: '104607040', firstName: 'Minh', lastName: 'Pham', email: 'minh.pham@student.example.edu', major: 'Artificial Intelligence', campus: 'Sarawak', year: 2, score: 67, grade: 'C', status: 'Active', enrolled: '2024-07-02' },
  { id: 29, studentId: '104482050', firstName: 'Sienna', lastName: 'White', email: 'sienna.white@student.example.edu', major: 'Artificial Intelligence', campus: 'Online', year: 1, score: 51, grade: 'P', status: 'Active', enrolled: '2025-06-20' },
  { id: 30, studentId: '104761570', firstName: 'Tom', lastName: 'Clarke', email: 'tom.clarke@student.example.edu', major: 'Internet of Things', campus: 'Hawthorn', year: 2, score: 61, grade: 'C', status: 'Active', enrolled: '2024-05-11' },
  { id: 31, studentId: '104020855', firstName: 'Aisha', lastName: 'Khan', email: 'aisha.khan@student.example.edu', major: 'Software Development', campus: 'Online', year: 3, score: 41, grade: 'N', status: 'At risk', enrolled: '2023-04-17' },
  { id: 32, studentId: '104432456', firstName: 'Ben', lastName: 'Evans', email: 'ben.evans@student.example.edu', major: 'Internet of Things', campus: 'Hawthorn', year: 2, score: 91, grade: 'HD', status: 'Active', enrolled: '2024-11-26' },
];

export const MAJORS = ['Artificial Intelligence', 'Cybersecurity', 'Software Development', 'Data Science', 'Internet of Things'];

export const GRADES = ['HD', 'D', 'C', 'P', 'N'];

/** Find one student by id (ids in URLs are strings, so convert first). */
export function getStudentById(id) {
  return students.find((student) => student.id === Number(id));
}
