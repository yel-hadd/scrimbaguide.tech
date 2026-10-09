// Stamps the LLM publisher-note review date at build/deploy time.
//
// Writes worker/llm-review-date.ts (gitignored), which worker/index.ts imports
// for the "Last reviewed:" line in /llm-context.txt. Runs via the `prebuild`
// npm hook so the file exists before the wrangler bundle.
//
// NOTE: this reflects the DEPLOY date, not a genuine content review — it will
// advance on every deploy regardless of whether the note changed. This is a
// deliberate project choice; see the import site in worker/index.ts.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const date = new Date().toISOString().slice(0, 10);
const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'worker', 'llm-review-date.ts');

const contents =
  `// AUTO-GENERATED at build time by scripts/stamp-llm-review-date.mjs — do not edit.\n` +
  `export const LLM_CONTEXT_LAST_REVIEWED = '${date}';\n`;

writeFileSync(outPath, contents);
console.log(`Stamped LLM_CONTEXT_LAST_REVIEWED = ${date} -> worker/llm-review-date.ts`);
