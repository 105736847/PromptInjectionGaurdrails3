/**
 * generate-project-tree.mjs – walks this project's src/ folder and writes
 * projectTree.json next to this script: a { name, children } hierarchy with
 * the size in bytes and the number of lines of every file – exactly the shape
 * d3.hierarchy() expects.
 *
 * This is plain Node.js (it runs in the terminal, not in the browser).
 * Run it from the project root whenever the code changes:
 *
 *   node src/pages/d3-networks/demos/data/generate-project-tree.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../../..'); // data → demos → d3-networks → pages → src
const OUTPUT = path.join(here, 'projectTree.json');

function countLines(text) {
  if (text === '') return 0;
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

/** Recursively describe a folder: sub-folders become nodes, files become leaves. */
function walk(dir) {
  const children = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.')) // skip .DS_Store and friends
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const folder = walk(full);
        return folder.children.length > 0 ? folder : null; // drop empty folders
      }
      if (full === OUTPUT) return null; // don't measure the snapshot itself
      return { name: entry.name, bytes: statSync(full).size, lines: countLines(readFileSync(full, 'utf8')) };
    })
    .filter(Boolean);
  return { name: path.basename(dir), children };
}

const tree = { ...walk(SRC), generated: new Date().toLocaleDateString('en-CA') }; // YYYY-MM-DD, local time
writeFileSync(OUTPUT, `${JSON.stringify(tree)}\n`);

let files = 0;
(function count(node) {
  if (node.children) node.children.forEach(count);
  else files += 1;
})(tree);
console.log(`Wrote ${path.relative(process.cwd(), OUTPUT)} (${files} files)`);
