/**
 * pySource.js – cut named parts out of a Python file so each DemoCard shows only
 * the back-end code that belongs to it.
 *
 * backend/app/routers/basics.py marks its parts like this:
 *     # region hello
 *     ...code...
 *     # endregion
 * The page imports the whole file as text (Vite's ?raw), and pyRegion() returns
 * just the requested region(s). The text still comes straight from the real file,
 * so the code you read in a Code tab is always the code that is running.
 */
export function pyRegion(source, names, file = 'backend/app/routers/basics.py') {
  const lines = source.split('\n');
  const parts = [].concat(names).map((name) => {
    const start = lines.findIndex((line) => line.trim() === `# region ${name}`);
    const end = lines.findIndex((line, index) => index > start && line.trim() === '# endregion');
    if (start === -1 || end === -1) return `# (region "${name}" not found in ${file})`;
    // start/end are 0-based indexes of the marker lines → the code is on lines start+2 … end.
    return [`# ─── ${file}, lines ${start + 2}–${end} ───`, ...lines.slice(start + 1, end)].join('\n');
  });
  return parts.join('\n\n\n');
}
