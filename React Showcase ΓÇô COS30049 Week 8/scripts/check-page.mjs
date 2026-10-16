// TEMPORARY dev helper (will be deleted): bundles one page entry to verify
// syntax + import resolution without touching other pages.
// Usage: node scripts/check-page.mjs src/pages/fastapi/FastApiPage.jsx [more entries...]
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const entries = process.argv.slice(2);
let failed = false;
for (const entry of entries) {
  try {
    await build({
      configFile: false,
      logLevel: 'error',
      plugins: [react()],
      build: {
        lib: { entry: path.resolve(entry), formats: ['es'], fileName: 'check' },
        write: false,
        minify: false,
        emptyOutDir: false,
      },
    });
    console.log(`✓ ${entry}`);
  } catch (err) {
    failed = true;
    console.error(`✗ ${entry}\n${err.message}`);
  }
}
process.exit(failed ? 1 : 0);
