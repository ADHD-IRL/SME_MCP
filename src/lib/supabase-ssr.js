import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Anon-key clients for the dashboard. These run as the signed-in user
// (RLS applies) — distinct from the service-role client in supabase.js,
// which the MCP server and privileged server actions use.

function anonConfig() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url) throw new Error('SUPABASE_URL is not configured');
  if (!anon) throw new Error('SUPABASE_ANON_KEY is not configured');
  return { url, anon };
}

// For server components and server actions.
export async function getServerSupabase() {
  const { url, anon } = anonConfig();
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a server component render — middleware handles refresh
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Admins are designated by the operator via the ADMIN_EMAILS env var
// (comma-separated). Keeps the admin surface deploy-config-driven with no
// schema change or self-escalation path.
export function isAdminEmail(email) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
