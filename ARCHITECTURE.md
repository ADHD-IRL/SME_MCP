# SME Library — Architecture

A standalone, multi-tenant service where anyone can use MCP to obtain Subject Matter Expert
profiles for their projects. Hosted on Vercel with a Supabase backend.

## System overview

```
┌─ Claude / agents ────────────┐        ┌─ Humans ─────────────┐
│  MCP clients (HTTP)          │        │  Admin UI (phase 5)  │
└──────────┬───────────────────┘        └──────────┬───────────┘
           │ Authorization: Bearer sme_live_…      │ Supabase Auth
┌──────────▼────────────────────────────────────────▼───────────┐
│  Vercel — one Next.js app                                     │
│  /api/mcp  (mcp-handler, Streamable HTTP)                     │
│  ├─ auth middleware: key hash lookup → workspace + scopes     │
│  ├─ tool registry (transport-agnostic; stdio for local dev)   │
│  ├─ per-key rate limiting (Postgres fixed-window)             │
│  └─ /api/cron/* : score recompute, decay, embeddings (ph. 3+) │
└──────────┬────────────────────────────────────────────────────┘
┌──────────▼────────────────────────────────────────────────────┐
│  Supabase (standalone project)                                │
│  workspaces · api_keys · smes · sme_versions · sme_feedback   │
│  library_promotions · audit_log · rate_limits                 │
│  FTS (tsvector) + pgvector · RLS deny-all defense-in-depth    │
└───────────────────────────────────────────────────────────────┘
```

## Key decisions

**Transport.** Streamable HTTP via `mcp-handler` at `/api/mcp`; SSE disabled (legacy, would
require Redis for resumability). The tool registry (`src/tools/`) is transport-agnostic —
`bin/stdio.js` reuses it for local development.

**Auth — two tracks.** Agents authenticate with bearer API keys (`sme_live_...`) in the HTTP
header, resolved once per request into `{ workspaceId, scopes, tier }` and injected into tool
handlers. The credential never appears in tool schemas, so the LLM never sees or handles it.
Keys are SHA-256-hashed at rest with scopes (`read` / `write` / `promote` / `admin`), expiry,
and revocation. Humans authenticate with **Supabase Auth** (email/password) on a self-service
dashboard: first login auto-creates a workspace (`workspace_members` maps users → workspaces),
and users mint/revoke their own keys. The dashboard uses anon-key SSR clients (RLS applies);
privileged key operations run through the service-role client behind a membership check.
Still planned: OAuth 2.1 (dynamic client registration + PKCE) so claude.ai custom connectors
can authorize interactively instead of pasting a key.

**Data model.** A domain-agnostic core profile (name, discipline, expertise level, persona,
background, reasoning style, cognitive biases, strengths, limitations, communication style,
domain knowledge, tags) plus a namespaced `extensions` jsonb for domain packs (red-teaming,
legal, medical, …). This is the hardest thing to change after third parties depend on it, so it
ships generalized from day one.

- `sme_versions` — full jsonb snapshot per edit; enables rollback, diffing, and library re-sync.
- `sme_feedback` — raw per-session events. The cached `quality_score` is recomputed with
  Bayesian smoothing (`(C·m + Σscores)/(C + n)`, C=20, m=70) so small samples don't dominate.
- `library_promotions` — promotion is a moderated queue, not an instant copy. Automated gates
  (min usage, min quality, dedup against the library) run at proposal time; an admin approves.
  Library entries are immutable copies with lineage (`cloned_from_id`).
- `audit_log` — every write, keyed by api_key + workspace. Doubles as usage metering.
- `rate_limits` — fixed-window counters in Postgres (no Redis): per-key request limits plus a
  separate daily `generations` quota, since `generate_sme` spends Anthropic tokens on our bill.

**Search.** Three tiers behind one `search_smes` tool (`mode: hybrid | keyword | semantic`,
default hybrid): structured filters (GIN on tags), keyword FTS (generated weighted
`search_vector` column), and semantic pgvector (`embedding vector(384)`, gte-small via a
Supabase Edge Function — `supabase/functions/embed`). Hybrid fuses both rankings with
reciprocal rank fusion (k=60). Embeddings are computed fail-soft at write time and backfilled
by the daily cron; if the edge function isn't deployed, everything degrades to keyword FTS.

**Generation cost control.** `generate_sme` searches the library first and returns a strong
existing match instead of generating (`skip_dedup` opts out) — library hygiene and cost control
in one check. Daily per-key generation quotas guard the Anthropic spend.

**Lifecycle.** `draft → active → deprecated → archived`; archive replaces hard deletion.
Library SMEs are immutable — customization happens by cloning into a workspace.

## Phases

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Standalone schema, HTTP transport, hashed-key auth, rate limits, 11 tools | ✅ |
| 3 | Semantic search: gte-small edge function, write-time embeds + backfill, hybrid RRF ranking | ✅ |
| 4 | Daily cron: quality recompute, rate-limit cleanup, embedding backfill | ✅ (decay + LLM content screen on promotion still planned) |
| 2 | Supabase Auth: self-service signup, auto workspace, dashboard key issuance/revocation | ✅ (OAuth 2.1 for claude.ai connectors still planned) |
| 5 | Admin UI (promotion review + library management), edge-cached public library endpoint | ✅ (usage dashboards still planned) |

## Admin & caching (phase 5)

- **Promotion review** lives at `/dashboard/admin`, gated by the `ADMIN_EMAILS` env var
  (deploy-config-driven; no schema change, no self-escalation). Approve/reject reuses the same
  `src/lib/promotions.js` logic as the `review_promotion` MCP tool.
- **Library management** at `/dashboard/admin/library`: admins browse all library SMEs by status
  (active/deprecated/archived), edit core fields (each save snapshots a new version and re-embeds),
  flip status, and permanently delete. Scoped strictly to the library workspace
  (`src/lib/admin-library.js`), so this surface can never touch a private workspace SME.
- **Public library endpoint** `GET /api/library` is unauthenticated and CDN-cached
  (`s-maxage=300, stale-while-revalidate=86400`) — the cheap read "front door". The library
  only changes when a promotion is approved, so stale-while-revalidate keeps it fast and fresh.

## Scaling notes

- Read path (library search/get) dominates traffic → the cached `/api/library` endpoint absorbs
  anonymous browse traffic at the edge, since the library only changes on approved promotions.
- Write path stays strictly authenticated and workspace-scoped in the DAL; RLS deny-all means a
  leaked anon key reads nothing.
- Serverless-friendly: no in-process state, lazy singletons for Supabase/Anthropic clients,
  Postgres-backed rate limiting.
