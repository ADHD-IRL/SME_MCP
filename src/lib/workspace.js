import { getSupabase } from './supabase.js';
import { generateKey } from './auth.js';

// Privileged workspace/key operations, run with the service-role client after
// the caller's identity and membership have been verified in a server action.

// Ensure a signed-in user has a workspace; create one on first login.
export async function ensureWorkspace(user) {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) return existing.workspace_id;

  const name = user.email ? `${user.email.split('@')[0]}'s workspace` : 'My workspace';
  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name })
    .select('id')
    .single();
  if (wsErr) throw new Error(wsErr.message);

  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' });
  if (memErr) throw new Error(memErr.message);

  return workspace.id;
}

export async function getMembership(user) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name, plan)')
    .eq('user_id', user.id)
    .maybeSingle();
  return data;
}

export async function assertMember(user, workspaceId) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (!data) throw new Error('Not a member of this workspace');
  return data.role;
}

export async function listKeys(workspaceId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, rate_limit_tier, expires_at, revoked_at, last_used_at, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

const ALLOWED_SCOPES = ['read', 'write', 'promote'];

// Mint a key for a workspace. Returns the plaintext once. Non-admin scopes
// only — 'admin' is reserved for operator-issued keys (scripts/create-key.mjs).
export async function issueKey(workspaceId, { name, scopes }) {
  const clean = (scopes ?? ['read', 'write']).filter((s) => ALLOWED_SCOPES.includes(s));
  if (clean.length === 0) throw new Error('Select at least one scope');

  const { key, keyPrefix, keyHash } = generateKey();
  const { error } = await getSupabase().from('api_keys').insert({
    workspace_id: workspaceId,
    name: name || 'Dashboard key',
    key_prefix: keyPrefix,
    key_hash: keyHash,
    scopes: clean,
    rate_limit_tier: 'free',
  });
  if (error) throw new Error(error.message);
  return key;
}

export async function revokeKey(workspaceId, keyId) {
  const { error } = await getSupabase()
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('workspace_id', workspaceId)
    .is('revoked_at', null);
  if (error) throw new Error(error.message);
}
