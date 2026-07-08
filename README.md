# SME Library MCP

A hosted [MCP](https://modelcontextprotocol.io) server for creating, searching, and sharing
**Subject Matter Expert profiles** that AI agents can consult. Anyone can connect their agent,
pull vetted experts from the shared library, maintain private experts in their own workspace,
and contribute good ones back through a moderated promotion pipeline.

Runs on **Vercel** (Next.js + Streamable HTTP transport) with a **Supabase** backend.
See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design and roadmap.

## Tools

| Tool | Scope | What it does |
|---|---|---|
| `search_smes` | read | Full-text + tag + expertise search across library and workspace |
| `list_smes` | read | Browse library / workspace SMEs, ranked by quality |
| `get_sme` | read | Fetch one full profile |
| `create_sme` | write | Author a new workspace SME (versioned from v1) |
| `update_sme` | write | Edit a workspace SME; every edit snapshots version history |
| `archive_sme` | write | Soft-delete (reversible) |
| `clone_sme` | write | Copy a library SME into your workspace as an editable private copy |
| `generate_sme` | write | AI-generate a profile — dedups against the library first; quota-limited |
| `record_feedback` | write | Score an SME's session performance; drives the smoothed quality score |
| `propose_promotion` | write | Nominate a workspace SME for the shared library (auto-gated + moderated) |
| `review_promotion` | admin | Approve/reject the promotion queue |

## Setup

### 1. Supabase

Create a project, then apply the migration:

```bash
supabase link --project-ref <ref>
supabase db push          # applies supabase/migrations/001_initial_schema.sql
```

### 2. Create a workspace + API key

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/create-key.mjs --workspace "My Team"            # read,write key
  node scripts/create-key.mjs --workspace "Ops" --admin        # admin key
```

The plaintext key (`sme_live_...`) is printed once; only its SHA-256 hash is stored.

### 3. Deploy to Vercel

```bash
vercel deploy
```

Set env vars in the Vercel project: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.

### 4. Connect a client

```bash
claude mcp add --transport http sme-library \
  https://<deployment>/api/mcp \
  --header "Authorization: Bearer sme_live_..."
```

Works with Claude Code, claude.ai custom connectors, and any Streamable-HTTP MCP client.

### Local development

```bash
cp .env.example .env      # fill in Supabase + Anthropic
npm install
npm run dev               # HTTP server on :3000 (endpoint: /api/mcp)
SME_API_KEY=sme_live_... npm run stdio   # or stdio transport for local clients
```

## Security model

- API keys are **hashed at rest** (SHA-256) and passed only in the `Authorization` header —
  the credential never appears in tool arguments or the model's context.
- Every key maps to one workspace with scopes (`read`, `write`, `promote`, `admin`) and a
  rate-limit tier; per-key fixed-window limits are enforced in Postgres.
- Supabase RLS is enabled deny-all on every table as defense-in-depth; only the server's
  service-role client can read or write.
- All writes land in `audit_log`.
