/**
 * csv.js – turn an array of objects into a CSV file and download it,
 * entirely in the browser (no server needed).
 */
const COLUMNS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'major', label: 'Major' },
  { key: 'campus', label: 'Campus' },
  { key: 'score', label: 'Score' },
  { key: 'grade', label: 'Grade' },
  { key: 'status', label: 'Status' },
];

/** Quote a value if it contains a comma, quote or line break ("" escapes a quote). */
function escapeCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows, columns = COLUMNS) {
  const header = columns.map((column) => escapeCell(column.label)).join(',');
  const lines = rows.map((row) => columns.map((column) => escapeCell(row[column.key])).join(','));
  return [header, ...lines].join('\r\n');
}

export function downloadCsv(rows, filename = 'students.csv') {
  // 1. Put the text into a Blob (a file-like object living in memory).
  //    The ﻿ "byte order mark" helps Excel detect UTF-8.
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  // 2. Create a temporary URL that points at the Blob.
  const url = URL.createObjectURL(blob);
  // 3. Click an invisible <a download> link, then clean up.
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Release the memory once the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
