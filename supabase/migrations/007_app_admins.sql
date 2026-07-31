-- In-app admin grants. Supplements the ADMIN_EMAILS env bootstrap: a user is
-- an admin if their email is listed in ADMIN_EMAILS OR they have a row here.
-- Env admins can never be revoked in-app (they aren't stored here), so the
-- operator always retains a lockout-proof way in.
--
-- Only the service role (privileged server actions) reads or writes this table.
create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table app_admins enable row level security;
-- No policies → deny-all for anon/authenticated. The service role bypasses RLS.
