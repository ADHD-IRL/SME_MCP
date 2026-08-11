#!/usr/bin/env node
// Seed the shared library from an import file (default: the AgentDebate
// personas dataset committed under data/).
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/seed-library.mjs [path/to/import.json] [--dry-run]
//
// The file may be a bare array, a single object, or { smes: [...] }. Rows are
// inserted into the library workspace as visibility=library, source=imported.
// Each row is validated and embedded independently — one bad row is skipped,
// the rest continue. Requires migrations 005–007 to be applied.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { importSmes, parseImportPayload, LIBRARY_WORKSPACE_ID } from '../src/lib/smes.js';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((a) => !a.startsWith('--'))
  || resolve(here, '../data/agentdebate-personas.library.json');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const items = parseImportPayload(readFileSync(file, 'utf8'));
console.log(`Loaded ${items.length} profiles from ${file}`);

if (dryRun) {
  console.log('--dry-run: not writing. First profile:');
  console.log(JSON.stringify(items[0], null, 2));
  process.exit(0);
}

// importSmes caps at 500/call; chunk larger datasets.
const CHUNK = 400;
let imported = 0;
let failed = 0;
const errors = [];
for (let i = 0; i < items.length; i += CHUNK) {
  const slice = items.slice(i, i + CHUNK);
  const r = await importSmes({
    workspaceId: LIBRARY_WORKSPACE_ID,
    items: slice,
    visibility: 'library',
    source: 'imported',
  });
  imported += r.imported;
  failed += r.failed;
  errors.push(...r.errors);
  console.log(`  batch ${i / CHUNK + 1}: +${r.imported} imported, ${r.failed} failed`);
}

console.log(`\nDone. Imported ${imported}, failed ${failed}.`);
if (errors.length) {
  console.log('First errors:');
  errors.slice(0, 10).forEach((e) => console.log(`  #${e.index} ${e.name || ''}: ${e.error}`));
  process.exit(failed === items.length ? 1 : 0);
}
