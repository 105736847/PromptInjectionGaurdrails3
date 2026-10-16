/**
 * prerequisites.js – a FICTIONAL prerequisite network of 30 computing units.
 *
 * A graph is just two arrays:
 *   nodes = the units            { id, name, year }
 *   links = "A is needed for B"  { source: 'A', target: 'B' }
 */
const UNITS = [
  // [code, name, prerequisite codes]
  ['COS10001', 'Introduction to Programming', []],
  ['COS10002', 'Computer Systems', []],
  ['COS10003', 'Discrete Mathematics', []],
  ['COS10004', 'Web Development Fundamentals', []],
  ['COS10005', 'Professional Practice in IT', []],
  ['COS10006', 'Object-Oriented Programming', ['COS10001']],
  ['COS10007', 'Introduction to Databases', ['COS10001']],
  ['COS10008', 'Networks & Operating Systems', ['COS10002']],
  ['COS10009', 'Statistics for Computing', ['COS10003']],
  ['COS10010', 'User Experience Design', ['COS10004']],
  ['COS20001', 'Data Structures & Algorithms', ['COS10006', 'COS10003']],
  ['COS20002', 'Software Engineering', ['COS10006', 'COS10005']],
  ['COS20003', 'Database Systems', ['COS10007']],
  ['COS20004', 'Front-End Web Development', ['COS10004', 'COS10006']],
  ['COS20005', 'Mathematics for Machine Learning', ['COS10003', 'COS10009']],
  ['COS20006', 'Cloud Computing', ['COS10008']],
  ['COS20007', 'Cyber Security Fundamentals', ['COS10008']],
  ['COS20008', 'Human–Computer Interaction', ['COS10010']],
  ['COS20009', 'Back-End Development & APIs', ['COS10007', 'COS10006']],
  ['COS20010', 'Introduction to AI', ['COS20001', 'COS10009']],
  ['COS30001', 'Machine Learning', ['COS20010', 'COS20005']],
  ['COS30002', 'Deep Learning', ['COS30001']],
  ['COS30003', 'Data Visualisation', ['COS20004', 'COS10009']],
  ['COS30004', 'Distributed Systems', ['COS20006', 'COS20001']],
  ['COS30005', 'Secure Software Development', ['COS20007', 'COS20002']],
  ['COS30006', 'Mobile App Development', ['COS20004', 'COS20002']],
  ['COS30007', 'Big Data Analytics', ['COS20003', 'COS20006']],
  ['COS30008', 'Natural Language Processing', ['COS30001']],
  ['COS30049', 'Computing Technology Innovation Project', ['COS20002', 'COS20004', 'COS20009']],
  ['COS30050', 'Capstone Project', ['COS30049', 'COS30005']],
];

export const units = UNITS.map(([id, name]) => ({
  id,
  name,
  year: Number(id[3]), // COS1xxxx → year 1, COS2xxxx → year 2 …
}));

export const prerequisites = UNITS.flatMap(([id, , needs]) =>
  needs.map((need) => ({ source: need, target: id })),
);

export const YEARS = [1, 2, 3];

/** Walk the arrows breadth-first: 'up' = everything you must pass first, 'down' = everything it unlocks. */
export function walk(id, direction) {
  const [from, to] = direction === 'up' ? ['target', 'source'] : ['source', 'target'];
  const found = new Set();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const link of prerequisites) {
      if (link[from] === current && !found.has(link[to])) {
        found.add(link[to]);
        queue.push(link[to]);
      }
    }
  }
  return found;
}

/** The whole prerequisite chain of a unit: its ancestors + itself + its descendants. */
export function prerequisiteChain(id) {
  return new Set([...walk(id, 'up'), id, ...walk(id, 'down')]);
}
