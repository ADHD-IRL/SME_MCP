import { supabase } from './supabase-admin.js';

export async function resolveToken(token) {
  if (!token) throw new Error('No token provided');

  const { data, error } = await supabase
    .from('sme_tokens')
    .select('workspace_id, permissions, expires_at')
    .eq('token', token)
    .single();

  if (error || !data) throw new Error('Invalid or unknown token');
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error('Token has expired');
  }

  // Update last_used_at (fire-and-forget)
  supabase.from('sme_tokens').update({ last_used_at: new Date().toISOString() }).eq('token', token).then(() => {});

  return { workspace_id: data.workspace_id, permissions: data.permissions || ['read', 'write'] };
}

export function requireWrite(permissions) {
  if (!permissions.includes('write')) throw new Error('Token does not have write permission');
}
