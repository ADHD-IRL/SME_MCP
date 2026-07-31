import { getSupabase } from './supabase.js';
import { isAdminEmail } from './supabase-ssr.js';

// Re-export so callers get env + DB admin helpers from one module.
export { isAdminEmail };

// Admin resolution. A user is an admin if their email is in ADMIN_EMAILS
// (env bootstrap, lockout-proof) OR they have a row in app_admins (in-app
// grants managed from the account page). All of this runs with the service
// role after the caller's identity has been verified.

// True if `user` is an admin by either mechanism.
export async function isAdmin(user) {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const { data, error } = await getSupabase()
    .from('app_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

// The set of user ids granted admin in-app (excludes env admins).
export async function listAdmins() {
  const { data, error } = await getSupabase()
    .from('app_admins')
    .select('user_id, email, granted_by, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// All auth users, for the admin management table. Paginated by supabase-js;
// we walk pages up to a sane cap.
export async function listAppUsers() {
  const supabase = getSupabase();
  const perPage = 200;
  const users = [];
  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));
}

// Grant admin to a user by id. Idempotent (upsert on the primary key).
export async function grantAdmin({ userId, email, grantedBy }) {
  if (!userId) throw new Error('A user is required');
  const { error } = await getSupabase()
    .from('app_admins')
    .upsert(
      { user_id: userId, email: email || null, granted_by: grantedBy || null },
      { onConflict: 'user_id' },
    );
  if (error) throw new Error(error.message);
}

// Revoke an in-app admin grant. Env admins are unaffected (not stored here).
export async function revokeAdmin(userId) {
  if (!userId) throw new Error('A user is required');
  const { error } = await getSupabase()
    .from('app_admins')
    .delete()
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
