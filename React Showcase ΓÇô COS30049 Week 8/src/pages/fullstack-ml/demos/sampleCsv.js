/**
 * sampleCsv.js – make CSV files IN THE BROWSER: no server, no files on disk.
 *
 *   const rows = sampleRows(60);                 // [{ url, label }, …] – fictional, seeded
 *   const text = toCsv(rows);                    // "url,label\n…"
 *   downloadText(text, 'sample-urls.csv');       // the browser saves it
 *   const file = new File([text], 'x.csv', { type: 'text/csv' });   // or upload it directly
 *
 * A File is just a Blob with a name, so the upload code cannot tell the
 * difference between these generated files and one the user picked.
 */
import * as d3 from 'd3';

const SAFE = [
  'https://www.brightwater-uni.example/courses/cos30049', 'https://library.brightwater-uni.example/search?q=react+hooks',
  'https://docs.pyfriends.example/tutorial/fastapi', 'https://www.harbourcity-news.example/2026/events/open-day',
  'https://shop.greenleaf-books.example/books', 'https://maps.roamly.example/melbourne',
  'https://learn.brightwater-uni.example/login', 'https://www.southbay-weather.example/weather?week=8',
  'https://careers.northwind-labs.example/jobs/graduate', 'https://blog.pixelgarden.example/photos/campus',
];
const BRANDS = ['brightwater-uni', 'greenleaf-books', 'harbourcity-bank', 'roamly', 'pyfriends'];
const WORDS = ['login', 'verify', 'account', 'update', 'secure', 'signin', 'confirm'];

/** Deterministic fictional rows: the same list on every reload (seeded random numbers). */
export function sampleRows(n = 60, seed = 7) {
  const random = d3.randomLcg(seed);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const token = (len) => Array.from({ length: len }, () => pick([...'abcdefghijkmnpqrstuvwxyz23456789'])).join('');
  const templates = [
    () => `http://203.0.113.${1 + Math.floor(random() * 250)}/${pick(BRANDS)}/${pick(WORDS)}`,
    () => `http://${pick(BRANDS)}-support-${pick(WORDS)}.test/${pick(WORDS)}/${token(6)}?id=${token(10)}&n=${Math.floor(random() * 9e4)}`,
    () => `http://${pick(BRANDS)}.example@198.51.100.${1 + Math.floor(random() * 250)}/${pick(WORDS)}`,
    () => `https://${token(10)}.invalid/${token(7)}/${pick(WORDS)}?s=${token(12)}&n=${Math.floor(random() * 9e3)}`,
    () => `https://www.${pick(['brlghtwater-uni', 'greenleaf-b00ks', 'roamIy'])}.example/${pick(WORDS)}`,
  ];
  return Array.from({ length: n }, () => {
    const suspicious = random() < 0.4;
    return suspicious ? { url: pick(templates)(), label: 1 } : { url: pick(SAFE), label: 0 };
  });
}

/** Rows → CSV text. Cells with a comma, quote or newline are wrapped in quotes (RFC 4180). */
export function toCsv(rows, columns = ['url', 'label']) {
  const cell = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [columns.join(','), ...rows.map((row) => columns.map((c) => cell(row[c])).join(','))].join('\n') + '\n';
}

/** The sample used by the demo: 60 rows plus two broken ones, so "skipped rows" shows up too. */
export function sampleCsvText() {
  const rows = sampleRows(60);
  rows.splice(12, 0, { url: '', label: 1 }); // empty cell → skipped
  rows.splice(30, 0, { url: 'https://www.brightwater-uni.example/my notes', label: 0 }); // space → skipped
  return toCsv(rows);
}

/** Ask the browser to save text as a file: Blob → temporary object URL → <a download>. */
export function downloadText(text, filename, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // free the memory once the download has started
}

/** Files that the server must reject – each one triggers a different status code. */
export const BROKEN_FILES = [
  { label: 'Wrong type (.txt)', expect: 415, make: () => new File(['just some notes'], 'notes.txt', { type: 'text/plain' }) },
  { label: 'No url column', expect: 422, make: () => new File(['name,link\nAlex,https://a.example\n'], 'contacts.csv', { type: 'text/csv' }) },
  { label: 'Too big (1.2 MB)', expect: 413, make: () => new File([`url\n${'https://a.example/x\n'.repeat(60000)}`], 'huge.csv', { type: 'text/csv' }) },
  { label: '1,001 rows', expect: 422, make: () => new File([`url\n${'https://a.example/\n'.repeat(1001)}`], 'many.csv', { type: 'text/csv' }) },
];
