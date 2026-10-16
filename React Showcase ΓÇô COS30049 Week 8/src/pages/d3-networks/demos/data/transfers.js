/**
 * transfers.js – FICTIONAL numbers of students who switched major last year.
 * A chord diagram needs a square matrix: transfers[from][to].
 * Row = the major they LEFT, column = the major they JOINED (diagonal = 0).
 */
export const MAJORS = [
  { short: 'AI', name: 'Artificial Intelligence' },
  { short: 'Data Sci', name: 'Data Science' },
  { short: 'Software', name: 'Software Development' },
  { short: 'Cyber', name: 'Cybersecurity' },
  { short: 'Games', name: 'Games Development' },
  { short: 'Networks', name: 'Networks & Cloud' },
];

export const transfers = [
  //  AI  DS  SW  CY  GA  NE   ← to
  [0, 24, 18, 7, 5, 3], //      from AI
  [19, 0, 14, 5, 2, 4], //      from Data Science
  [22, 12, 0, 15, 17, 9], //    from Software
  [5, 4, 11, 0, 2, 16], //      from Cybersecurity
  [6, 3, 28, 3, 0, 2], //       from Games
  [3, 6, 8, 21, 1, 0], //       from Networks
];
