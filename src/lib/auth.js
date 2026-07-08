import { createHash, randomBytes } from 'node:crypto';
import { getSupabase } from './supabase.js';

const KEY_PREFIX = 'sme_live_';

export function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

// Generate a new API key. Returns { key, keyPrefix, keyHash } — the plaintext
// key is shown once and only the hash is stored.
export function generateKey() {
  const secret = randomBytes(24).toString('base64url');
  const key = `${KEY_PREFIX}${secret}`;
  return { key, keyPrefix: key.slice(0, KEY_PREFIX.length + 8), keyHash: hashKey(key) };
}

// Resolve a bearer token to an auth context, or null if invalid.
export async function resolveKey(bearerToken) {
  if (!bearerToken || !bearerToken.startsWith(KEY_PREFIX)) return null;

  let data;
  try {
    const supabase = getSupabase();
    const result = await supabase
      .from('api_keys')
      .select('id, workspace_id, scopes, rate_limit_tier, expires_at, revoked_at')
      .eq('key_hash', hashKey(bearerToken))
      .maybeSingle();
    if (result.error) return null;
    data = result.data;
  } catch {
    return null; // fail closed: misconfigured/unreachable backend → unauthorized
  }

  if (!data) return null;
  if (data.revoked_at) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // fire-and-forget usage stamp
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {}, () => {});

  return {
    keyId: data.id,
    workspaceId: data.workspace_id,
    scopes: data.scopes || ['read'],
    tier: data.rate_limit_tier || 'free',
  };
}

export function requireScope(ctx, scope) {
  if (!ctx.scopes.includes(scope) && !ctx.scopes.includes('admin')) {
    throw new Error(`This API key does not have the '${scope}' scope`);
  }
}
