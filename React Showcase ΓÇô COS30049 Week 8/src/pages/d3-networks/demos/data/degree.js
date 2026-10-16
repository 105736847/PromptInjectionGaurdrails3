/**
 * degree.js – a FICTIONAL degree structure: degree → majors → units.
 * Nested { name, children } objects are exactly what d3.hierarchy() expects.
 * The unit codes match the prerequisite network in prerequisites.js.
 */
const unit = (code, title) => ({ name: `${code} ${title}`, code, title });

export const degree = {
  name: 'Bachelor of Computer Science',
  short: 'BCompSc', // used on narrow screens
  children: [
    {
      name: 'Core units',
      children: [
        unit('COS10001', 'Introduction to Programming'),
        unit('COS10003', 'Discrete Mathematics'),
        unit('COS20001', 'Data Structures & Algorithms'),
        unit('COS20002', 'Software Engineering'),
        unit('COS30049', 'Computing Technology Innovation Project'),
        unit('COS30050', 'Capstone Project'),
      ],
    },
    {
      name: 'Artificial Intelligence',
      children: [
        unit('COS20005', 'Mathematics for Machine Learning'),
        unit('COS20010', 'Introduction to AI'),
        unit('COS30001', 'Machine Learning'),
        unit('COS30002', 'Deep Learning'),
        unit('COS30008', 'Natural Language Processing'),
      ],
    },
    {
      name: 'Data Science',
      children: [
        unit('COS10009', 'Statistics for Computing'),
        unit('COS20003', 'Database Systems'),
        unit('COS30003', 'Data Visualisation'),
        unit('COS30007', 'Big Data Analytics'),
      ],
    },
    {
      name: 'Software Development',
      children: [
        unit('COS20004', 'Front-End Web Development'),
        unit('COS20009', 'Back-End Development & APIs'),
        unit('COS10010', 'User Experience Design'),
        unit('COS30006', 'Mobile App Development'),
      ],
    },
    {
      name: 'Cybersecurity',
      children: [
        unit('COS10008', 'Networks & Operating Systems'),
        unit('COS20007', 'Cyber Security Fundamentals'),
        unit('COS30005', 'Secure Software Development'),
      ],
    },
    {
      name: 'Cloud Computing',
      children: [
        unit('COS20006', 'Cloud Computing'),
        unit('COS30004', 'Distributed Systems'),
        unit('COS30007', 'Big Data Analytics'),
      ],
    },
  ],
};
