-- Contact / lead capture. Written by the marketing site via the service-role
-- client; RLS deny-all like every other table (no public read).

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  company text,
  plan_interest text,
  message text,
  source text default 'contact_form',
  created_at timestamptz not null default now()
);
create index leads_created_idx on leads (created_at desc);

alter table leads enable row level security;
