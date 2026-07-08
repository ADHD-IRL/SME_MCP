-- SME Library — initial schema
-- Standalone Supabase project. All access goes through the MCP server's
-- service-role client; RLS is enabled deny-all as defense-in-depth.

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Workspaces
-- ---------------------------------------------------------------------------
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The shared public library lives in a well-known workspace.
insert into workspaces (id, name, slug, plan)
values ('00000000-0000-0000-0000-000000000001', 'SME Library', 'library', 'system');

-- ---------------------------------------------------------------------------
-- API keys (hashed at rest; the plaintext key is shown once at creation)
-- ---------------------------------------------------------------------------
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text,
  key_prefix text not null,              -- e.g. sme_live_Ab12Cd34 (for display/lookup UX)
  key_hash text not null unique,         -- sha256 hex of the full key
  scopes text[] not null default '{read,write}',  -- read | write | promote | admin
  rate_limit_tier text not null default 'free',
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index api_keys_workspace_idx on api_keys (workspace_id);

-- ---------------------------------------------------------------------------
-- SMEs — domain-agnostic core profile + jsonb extensions for domain packs
-- ---------------------------------------------------------------------------
create table smes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,

  -- core profile
  name text not null,
  discipline text not null,
  expertise_level text check (expertise_level in ('Junior','Mid-level','Senior','Expert','Principal')),
  persona_description text,
  professional_background text,
  reasoning_style text,
  cognitive_biases text,
  strengths text,
  limitations text,
  communication_style text,
  domain_knowledge text[] not null default '{}',
  tags text[] not null default '{}',
  extensions jsonb not null default '{}',   -- domain packs: red_team, legal, medical, ...

  -- lifecycle
  status text not null default 'active' check (status in ('draft','active','deprecated','archived')),
  visibility text not null default 'workspace' check (visibility in ('private','workspace','library')),
  current_version int not null default 1,
  source text not null default 'user' check (source in ('user','generated','cloned','promoted')),
  cloned_from_id uuid references smes(id) on delete set null,

  -- quality (denormalized cache, recomputed from sme_feedback)
  usage_count int not null default 0,
  quality_score numeric(4,1),

  -- search
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(discipline, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(persona_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(professional_background, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(reasoning_style, '')), 'C')
  ) stored,
  embedding vector(384),                    -- gte-small; populated by phase-3 backfill

  created_by uuid,                          -- api_keys.id that created it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index smes_workspace_idx on smes (workspace_id);
create index smes_visibility_idx on smes (visibility) where visibility = 'library';
create index smes_search_idx on smes using gin (search_vector);
create index smes_tags_idx on smes using gin (tags);
create index smes_embedding_idx on smes using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Version history — full snapshot per edit, enables rollback and diffing
-- ---------------------------------------------------------------------------
create table sme_versions (
  id uuid primary key default gen_random_uuid(),
  sme_id uuid not null references smes(id) on delete cascade,
  version int not null,
  profile jsonb not null,
  change_summary text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (sme_id, version)
);

-- ---------------------------------------------------------------------------
-- Feedback — raw per-session quality events (never overwritten)
-- ---------------------------------------------------------------------------
create table sme_feedback (
  id uuid primary key default gen_random_uuid(),
  sme_id uuid not null references smes(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete set null,
  session_id text,
  score numeric(4,1) not null check (score >= 0 and score <= 100),
  dimensions jsonb,
  notes text,
  created_at timestamptz not null default now()
);
create index sme_feedback_sme_idx on sme_feedback (sme_id);

-- Bayesian-smoothed quality: (C*m + sum) / (C + n) with prior C=20 pseudo-
-- observations at m=70, so one lucky 95 doesn't outrank fifty 85s.
create or replace function recompute_sme_quality(p_sme_id uuid)
returns void
language sql
security definer
as $$
  update smes s
  set usage_count = sub.n,
      quality_score = case when sub.n = 0 then null
                           else round(((20 * 70) + sub.total) / (20 + sub.n)::numeric, 1)
                      end,
      updated_at = now()
  from (
    select count(*)::int as n, coalesce(sum(score), 0) as total
    from sme_feedback
    where sme_id = p_sme_id
  ) sub
  where s.id = p_sme_id;
$$;

-- ---------------------------------------------------------------------------
-- Library promotion queue — moderated pipeline, not an instant copy
-- ---------------------------------------------------------------------------
create table library_promotions (
  id uuid primary key default gen_random_uuid(),
  sme_id uuid not null references smes(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  auto_checks jsonb,                        -- results of the automated gates
  reviewer uuid,                            -- api_keys.id of the reviewer
  review_notes text,
  library_sme_id uuid references smes(id),  -- set on approval
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index library_promotions_status_idx on library_promotions (status) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Audit log — every write lands here
-- ---------------------------------------------------------------------------
create table audit_log (
  id bigint generated always as identity primary key,
  api_key_id uuid,
  workspace_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_workspace_idx on audit_log (workspace_id, created_at);

-- ---------------------------------------------------------------------------
-- Rate limiting — fixed-window counters in Postgres (no Redis dependency)
-- ---------------------------------------------------------------------------
create table rate_limits (
  key_id uuid not null,
  bucket text not null,                     -- e.g. 'requests', 'generations'
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key_id, bucket, window_start)
);

-- Atomically increment the counter for the current window; returns the new
-- count so the caller can compare against its limit.
create or replace function increment_rate_limit(
  p_key_id uuid,
  p_bucket text,
  p_window_seconds int
)
returns int
language plpgsql
security definer
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c int;
begin
  insert into rate_limits (key_id, bucket, window_start, count)
  values (p_key_id, p_bucket, w, 1)
  on conflict (key_id, bucket, window_start)
  do update set count = rate_limits.count + 1
  returning count into c;
  return c;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS — deny-by-default on every table. The MCP server uses the service role
-- (which bypasses RLS); a leaked anon key can read nothing.
-- ---------------------------------------------------------------------------
alter table workspaces enable row level security;
alter table api_keys enable row level security;
alter table smes enable row level security;
alter table sme_versions enable row level security;
alter table sme_feedback enable row level security;
alter table library_promotions enable row level security;
alter table audit_log enable row level security;
alter table rate_limits enable row level security;
