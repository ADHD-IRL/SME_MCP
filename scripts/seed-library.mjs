#!/usr/bin/env node
// Seed the shared library from an import file (default: the personas dataset
// committed under data/).
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/seed-library.mjs [path/to/import.json] [--dry-run] [--upsert]
//
// The file may be a bare array, a single object, or { smes: [...] }. Every
// profile is enriched (all fields filled) before writing. Rows go into the
// library workspace as visibility=library.
//   default   insert new rows (source=imported)
//   --upsert  update existing library SMEs matched by name (fills in fields on
//             an already-imported library) and insert any that are missing.
// Requires migrations 005–007 to be applied.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { importSmes, createSme, parseImportPayload, LIBRARY_WORKSPACE_ID } from '../src/lib/smes.js';
import { getSupabase } from '../src/lib/supabase.js';
import { updateLibrarySme } from '../src/lib/admin-library.js';
import { enrichProfile } from '../src/lib/enrich-sme.js';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const upsert = args.includes('--upsert');
const file = args.find((a) => !a.startsWith('--'))
  || resolve(here, '../data/personas.library.json');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const raw = parseImportPayload(readFileSync(file, 'utf8'));
const disciplines = [...new Set(raw.map((s) => s.discipline).filter(Boolean))];
const items = raw.map((s) => enrichProfile(s, { disciplines }));
console.log(`Loaded and enriched ${items.length} profiles from ${file}`);

if (dryRun) {
  console.log('--dry-run: not writing. First profile:');
  console.log(JSON.stringify(items[0], null, 2));
  process.exit(0);
}

if (upsert) {
  // Match existing library SMEs by name and fill in their fields; insert the rest.
  const { data: existing, error } = await getSupabase()
    .from('smes')
    .select('id, name')
    .eq('workspace_id', LIBRARY_WORKSPACE_ID)
    .eq('visibility', 'library')
    .limit(5000);
  if (error) { console.error('Could not read existing library:', error.message); process.exit(1); }
  const byName = new Map(existing.map((r) => [r.name.trim().toLowerCase(), r.id]));

  let updated = 0; let inserted = 0; let failed = 0;
  for (const profile of items) {
    const key = String(profile.name || '').trim().toLowerCase();
    const id = byName.get(key);
    try {
      if (id) {
        await updateLibrarySme(id, profile, 'Enriched: full field build-out');
        updated += 1;
      } else {
        await createSme({ workspaceId: LIBRARY_WORKSPACE_ID, profile, visibility: 'library', source: 'imported' });
        inserted += 1;
      }
    } catch (err) {
      failed += 1;
      if (failed <= 10) console.log(`  ! ${profile.name}: ${err.message}`);
    }
    if ((updated + inserted) % 50 === 0) console.log(`  …${updated} updated, ${inserted} inserted`);
  }
  console.log(`\nDone. Updated ${updated}, inserted ${inserted}, failed ${failed}.`);
  process.exit(failed && failed === items.length ? 1 : 0);
}

// Insert mode. importSmes caps at 500/call; chunk larger datasets.
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
