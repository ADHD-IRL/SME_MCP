#!/usr/bin/env node
// Bootstrap/ops helper: create a workspace and an API key for it.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/create-key.mjs --workspace "My Team" [--scopes read,write] [--tier free] [--admin]
//
// The plaintext key is printed once and never stored.
import { createClient } from '@supabase/supabase-js';
import { generateKey } from '../src/lib/auth.js';

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};

const workspaceName = getArg('--workspace');
const scopes = args.includes('--admin')
  ? ['read', 'write', 'promote', 'admin']
  : getArg('--scopes', 'read,write').split(',');
const tier = getArg('--tier', 'free');

if (!workspaceName) {
  console.error('Usage: node scripts/create-key.mjs --workspace "Name" [--scopes read,write] [--tier free] [--admin]');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: workspace, error: wsErr } = await supabase
  .from('workspaces')
  .insert({ name: workspaceName })
  .select()
  .single();
if (wsErr) throw new Error(wsErr.message);

const { key, keyPrefix, keyHash } = generateKey();
const { data: apiKey, error: keyErr } = await supabase
  .from('api_keys')
  .insert({
    workspace_id: workspace.id,
    name: `${workspaceName} key`,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    scopes,
    rate_limit_tier: tier,
  })
  .select('id, scopes, rate_limit_tier')
  .single();
if (keyErr) throw new Error(keyErr.message);

console.log(`workspace_id: ${workspace.id}`);
console.log(`key_id:       ${apiKey.id}`);
console.log(`scopes:       ${apiKey.scopes.join(', ')} (tier: ${apiKey.rate_limit_tier})`);
console.log('');
console.log('API key (shown once, store it now):');
console.log(`  ${key}`);
