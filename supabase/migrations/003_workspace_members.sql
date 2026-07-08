-- Phase 2: self-service accounts via Supabase Auth.
-- Users sign in with Supabase Auth; each user gets (or joins) a workspace.
-- The dashboard runs server-side with the service role after a membership
-- check, but read policies exist as defense-in-depth for authenticated users.

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on workspace_members (user_id);

alter table workspace_members enable row level security;

-- Authenticated users can read their own memberships / workspaces / key
-- metadata (never key hashes — column privileges are still enforced by the
-- select list of the querying client; hashes are useless anyway, but scope
-- the policy reads to metadata usage in the dashboard).
create policy "members read own memberships"
  on workspace_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "members read their workspaces"
  on workspaces for select
  to authenticated
  using (exists (
    select 1 from workspace_members m
    where m.workspace_id = workspaces.id and m.user_id = (select auth.uid())
  ));

create policy "members read their api keys"
  on api_keys for select
  to authenticated
  using (exists (
    select 1 from workspace_members m
    where m.workspace_id = api_keys.workspace_id and m.user_id = (select auth.uid())
  ));
