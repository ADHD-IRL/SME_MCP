-- One-shot, idempotent catch-up for a database that's behind on migrations.
-- Safe to run repeatedly. Paste into the Supabase SQL editor (Dashboard → SQL)
-- or run `supabase db push` if you use the CLI. Covers migrations 002–007.

create extension if not exists vector;

-- 007: in-app admin grants (supplements the ADMIN_EMAILS env bootstrap)
create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table app_admins enable row level security;

-- 004: leads (contact capture)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  company text,
  plan_interest text,
  message text,
  source text default 'contact_form',
  created_at timestamptz not null default now()
);
create index if not exists leads_created_idx on leads (created_at desc);
alter table leads enable row level security;

-- 005: rich SME attributes (required by import / create)
alter table smes add column if not exists attributes jsonb not null default '{}';
alter table smes add column if not exists role_type text;

-- 006: allow 'imported' as an SME source (bulk / file import)
alter table smes drop constraint if exists smes_source_check;
alter table smes add constraint smes_source_check
  check (source in ('user', 'generated', 'cloned', 'promoted', 'imported'));

-- Rebuild the search vector to include the attribute text.
alter table smes drop column if exists search_vector;
alter table smes add column search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(discipline, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(persona_description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(professional_background, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(reasoning_style, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(attributes::text, '')), 'D')
) stored;
create index if not exists smes_search_idx on smes using gin (search_vector);

-- 002: semantic search + maintenance RPCs (optional but harmless)
create or replace function match_smes(
  p_embedding vector(384),
  p_workspace_id uuid,
  p_scope text default 'all',
  p_limit int default 10
)
returns table (id uuid, similarity float)
language sql stable security definer as $$
  select s.id, 1 - (s.embedding <=> p_embedding) as similarity
  from smes s
  where s.embedding is not null
    and s.status <> 'archived'
    and case p_scope
          when 'library' then s.visibility = 'library'
          when 'workspace' then s.workspace_id = p_workspace_id
          else (s.workspace_id = p_workspace_id or s.visibility = 'library')
        end
  order by s.embedding <=> p_embedding
  limit least(p_limit, 50);
$$;

-- 008: remove the legacy `agentdebate` provenance pack (institutional_incentives
-- promoted to an attribute; domain/is_ai_generated dropped).
update smes
set
  attributes = case
    when extensions -> 'agentdebate' ? 'institutional_incentives'
      then jsonb_set(coalesce(attributes, '{}'::jsonb), '{institutional_incentives}',
                     extensions -> 'agentdebate' -> 'institutional_incentives')
    else attributes
  end,
  extensions = extensions - 'agentdebate',
  updated_at = now()
where extensions ? 'agentdebate';
