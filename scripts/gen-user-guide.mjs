#!/usr/bin/env node
// Generate docs/USER_GUIDE.md from the single-source field docs so the Markdown
// guide never drifts from the in-app /guide page. Run: node scripts/gen-user-guide.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ATTRIBUTE_GROUPS } from '../src/lib/sme-schema.js';
import {
  VALUE_SCALES, CORE_FIELD_DOCS, ATTR_FIELD_DOCS, SYSTEM_FIELD_DOCS,
} from '../src/lib/sme-field-docs.js';

const esc = (s) => String(s).replace(/\|/g, '\\|');

const TOOLS = [
  ['Discover', [
    ['search_smes', 'Search by capability, tags, and expertise across the library and your workspace (hybrid keyword + semantic). Use before creating or generating.'],
    ['list_smes', 'List SMEs visible to your workspace — the library, your private SMEs, or both. Sorted by quality.'],
    ['get_sme', 'Fetch the full profile of a single SME by id.'],
  ]],
  ['Author', [
    ['create_sme', 'Create a new SME in your workspace.'],
    ['generate_sme', 'Generate a new SME with AI; returns an existing match first if one exists (counts against your daily quota).'],
    ['update_sme', 'Update one of your SMEs; every change snapshots the prior state (reversible).'],
    ['clone_sme', 'Copy a library SME (or your own) into your workspace as an editable copy, preserving lineage.'],
    ['archive_sme', 'Archive a workspace SME — hidden but recoverable. Replaces hard deletion.'],
  ]],
  ['Bulk', [
    ['import_smes', 'Bulk-import profiles; each row validated independently, invalid rows reported without aborting.'],
    ['export_smes', 'Export your workspace SMEs as an import-ready JSON payload for import_smes.'],
  ]],
  ['Improve & curate', [
    ['record_feedback', 'Record how well an SME performed (0–100); rolled into a smoothed quality score.'],
    ['propose_promotion', 'Propose a workspace SME for the shared library; automated gates then a moderation queue.'],
    ['review_promotion', 'Admin: approve or reject a pending promotion, or list the queue.'],
  ]],
];

let md = `# SME Library — User Guide

> Generated from \`src/lib/sme-field-docs.js\` via \`scripts/gen-user-guide.mjs\`. Edit the
> source, not this file. The same content is served in-app at \`/guide\`.

The SME Library is a shared, quality-ranked catalog of **Subject-Matter Expert (SME) profiles**
served over the Model Context Protocol (MCP). Each profile is a structured persona — a discipline,
a way of reasoning, known strengths and blind spots, evidence standards, and more — that an AI
agent can load to reason like a seasoned specialist, or that several agents can consult to
pressure-test a decision from different vantage points. Use the hosted shared library, keep private
SMEs in your own workspace, or self-host the whole stack.

## Contents
- [Quickstart](#quickstart)
- [The MCP tools](#the-mcp-tools)
- [Working with SMEs](#working-with-smes)
- [Field reference](#field-reference)
- [Value scales](#value-scales)
- [Extensions (domain packs)](#extensions-domain-packs)
- [Curation & quality](#curation--quality)
- [Email setup](#email-setup-confirmations--password-resets)
- [Self-hosting](#self-hosting)

## Quickstart
1. Create an account and an API key on the dashboard (\`/dashboard\`).
2. Point any MCP client at the server with that key:

\`\`\`bash
claude mcp add --transport http sme-library \\
  https://your-deployment/api/mcp \\
  --header "Authorization: Bearer sme_live_…"
\`\`\`

Then ask your agent to \`search_smes\` for the expertise you need, load the profile, and reason in
that expert's voice. Prefer \`clone_sme\` over authoring a duplicate, and \`record_feedback\` after a
session so the best experts rise.

## The MCP tools
Thirteen tools, grouped by what you're doing.

`;

for (const [group, tools] of TOOLS) {
  md += `\n### ${group}\n\n| Tool | What it does |\n| --- | --- |\n`;
  for (const [n, d] of tools) md += `| \`${n}\` | ${esc(d)} |\n`;
}

md += `
## Working with SMEs
**Find first.** Search or list before creating — a suitable expert may already exist. **Clone** a
library SME to get an editable private copy that keeps lineage to the original. **Create** or
**generate** when nothing fits; generation drafts the full structured attribute set for you.
**Import/export** move profiles in bulk as JSON (or the Markdown profile format). **Give feedback**
to shape quality scores, and **propose promotion** to contribute a strong SME back to the shared
library (an admin reviews it).

## Field reference

### Core fields
\`name\` and \`discipline\` are required; everything else is optional.

| Field | Type | Meaning |
| --- | --- | --- |
`;
for (const [n, t, d] of CORE_FIELD_DOCS) md += `| \`${n}\` | ${t} | ${esc(d)} |\n`;

md += `
### Structured attributes
The rich reasoning set, stored under \`attributes\`. Fields marked *(list)* hold a comma-separated
set of values. Every field is optional.
`;
for (const { group, fields } of ATTRIBUTE_GROUPS) {
  md += `\n#### ${group}\n\n| Field | Label | Meaning |\n| --- | --- | --- |\n`;
  for (const [key, label] of fields) {
    md += `| \`${key}\` | ${esc(label)} | ${esc(ATTR_FIELD_DOCS[key] || '—')} |\n`;
  }
}

md += `
### System fields (read-only)
Managed by the platform; shown when you read a profile.

| Field | Meaning |
| --- | --- |
`;
for (const [n, d] of SYSTEM_FIELD_DOCS) md += `| \`${n}\` | ${esc(d)} |\n`;

md += `
## Value scales
What the constrained fields' values mean.
`;
for (const [key, scale] of Object.entries(VALUE_SCALES)) {
  md += `\n### ${scale.label} \`${key}\`\n_${scale.kind}._`;
  if (scale.note) md += ` ${scale.note}`;
  md += `\n`;
  if (scale.values.length) {
    md += `\n| Value | Meaning |\n| --- | --- |\n`;
    for (const [v, meaning] of scale.values) md += `| \`${v}\` | ${esc(meaning)} |\n`;
  }
}

md += `
## Extensions (domain packs)
\`extensions\` holds optional namespaced packs so specialists carry extra fields without bloating
the core schema. The built-in example is \`red_team\`:

| red_team field | Meaning |
| --- | --- |
| \`focus\` | What the red-team lens concentrates on for this expert. |
| \`adversary_model\` | The adversary this expert reasons against — capabilities and intent. |
| \`severity_default\` | Default severity for this expert's findings (see the Severity scale). |
| \`weighting_adjustment\` | Relative weight for this expert's severity calls (see the Weighting adjustment scale). |

Packs are free-form: any object under a namespace is stored and displayed. Add your own (e.g.
\`clinical\`, \`legal\`) for vertical fields.

## Curation & quality
Every SME is **versioned** — updates snapshot the prior state, so changes are reversible.
\`quality_score\` is a smoothed rolling average of \`record_feedback\` (0–100) and drives search
ranking and promotion eligibility. To share a private SME, \`propose_promotion\` runs automated gates
(usage, quality, duplication) and, if they pass, queues it for an **admin** to approve in the
library console. Admins can also edit, deprecate, archive, or delete library entries and manage
other admins from the account page.

## Email setup (confirmations & password resets)
Account confirmation and password-reset emails are sent by **Supabase**, not by this app — the app
only asks Supabase to send them. If new accounts aren't receiving validation emails, it's a Supabase
configuration issue. Work through these in order:

1. **Configure custom SMTP** — the most common cause. Supabase's built-in email service is
   rate-limited to a handful of messages per hour and is for testing only, so the rest silently
   fail. In the Supabase dashboard: _Authentication → Emails → SMTP Settings_, enable custom SMTP,
   and add a provider (Resend, Postmark, SendGrid, or AWS SES — all have free tiers).
2. **Enable "Confirm email"** under _Authentication → Providers → Email_. If it's off, no email is
   sent and users are signed in immediately.
3. **Allow-list your URLs** under _Authentication → URL Configuration_: set _Site URL_ to your
   deployment and add \`https://your-deployment/auth/callback\` (and any Vercel preview URLs) to
   _Redirect URLs_. A confirmation link whose target isn't allow-listed won't work.
4. **Set \`NEXT_PUBLIC_BASE_URL\`** in your Vercel project to the canonical site URL (e.g.
   \`https://your-deployment\`). The app uses it to build the confirmation redirect, so a missing
   request origin can't produce an invalid link.
5. **Check the logs** under _Authentication → Logs_ and in your SMTP provider's dashboard to see
   send attempts and failures.

Users who didn't receive the first email can re-request it with **"Resend it"** on the sign-in page.

## Self-hosting
The stack is Next.js on Vercel + Supabase (Postgres, Auth, pgvector). Clone the repo, apply the SQL
migrations (or \`supabase/apply-latest.sql\`), set \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`,
\`SUPABASE_SERVICE_ROLE_KEY\`, and \`ADMIN_EMAILS\`, then deploy. See \`README.md\` and \`docs/\` for the
full setup.
`;

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/USER_GUIDE.md');
writeFileSync(out, md);
console.log(`Wrote ${out} (${md.length} bytes)`);
