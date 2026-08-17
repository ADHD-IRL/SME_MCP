#!/usr/bin/env node
// Fill out every SME field in a library import file, in place. Deterministic —
// re-running is idempotent and preserves source-authored values.
//   node scripts/enrich-library.mjs [data/personas.library.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { enrichProfile } from '../src/lib/enrich-sme.js';
import { ATTRIBUTE_GROUPS } from '../src/lib/sme-schema.js';

const file = process.argv[2]
  || resolve(dirname(fileURLToPath(import.meta.url)), '../data/personas.library.json');

const doc = JSON.parse(readFileSync(file, 'utf8'));
const smes = Array.isArray(doc) ? doc : doc.smes;
const disciplines = [...new Set(smes.map((s) => s.discipline).filter(Boolean))];

const enriched = smes.map((s) => enrichProfile(s, { disciplines }));
const out = Array.isArray(doc) ? enriched : { ...doc, count: enriched.length, smes: enriched };
writeFileSync(file, JSON.stringify(out, null, 2));

// Coverage report.
const keys = ATTRIBUTE_GROUPS.flatMap((g) => g.fields.map((f) => f[0]));
const filled = (v) => v != null && String(Array.isArray(v) ? v.join('') : v).trim() !== '';
const gaps = [];
for (const k of keys) {
  const n = enriched.filter((p) => filled(p.attributes?.[k])).length;
  if (n < enriched.length) gaps.push(`${k}: ${n}/${enriched.length}`);
}
const core = ['strengths', 'limitations', 'reasoning_style', 'communication_style', 'professional_background', 'cognitive_biases'];
const coreGaps = core.filter((c) => enriched.filter((p) => filled(p[c])).length < enriched.length);

console.log(`Enriched ${enriched.length} SMEs → ${file}`);
console.log(gaps.length ? `Attribute gaps: ${gaps.join(', ')}` : 'All attribute fields fully populated.');
console.log(coreGaps.length ? `Core gaps: ${coreGaps.join(', ')}` : 'All core fields fully populated.');

// Variation sanity: how many distinct values across the panel for debate-shaping fields.
const distinct = (k, isAttr = true) => new Set(enriched.map((p) => JSON.stringify(isAttr ? p.attributes?.[k] : p[k]))).size;
console.log('Variation (distinct values):', ['debate_role', 'rebuttal_style', 'risk_sensitivity', 'escalation_bias', 'false_negative_tolerance']
  .map((k) => `${k}=${distinct(k)}`).join(', '));
