import { z } from 'zod';
import { getSupabase, LIBRARY_WORKSPACE_ID } from './supabase.js';
import { profileShape, pickProfile, SME_SELECT } from './profile.js';
import { embedSme } from './embeddings.js';

// Single source of truth for creating and importing SMEs, reused by the
// create_sme / import_smes MCP tools and the dashboard UI.

const profileSchema = z.object(profileShape).strip();

export async function listWorkspaceSmes(workspaceId, { includeArchived = false } = {}) {
  let q = getSupabase()
    .from('smes')
    .select(SME_SELECT)
    .eq('workspace_id', workspaceId);
  if (!includeArchived) q = q.neq('status', 'archived');
  q = q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

// Create one SME. Validates the profile, inserts, snapshots version 1, embeds.
export async function createSme({
  workspaceId,
  profile,
  status = 'active',
  visibility = 'workspace',
  source = 'user',
  createdBy = null,
}) {
  const parsed = profileSchema.safeParse(profile);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.') || 'profile'}: ${i.message}`).join('; ');
    throw new Error(`Invalid profile — ${msg}`);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('smes')
    .insert({ ...parsed.data, workspace_id: workspaceId, status, visibility, source, created_by: createdBy })
    .select(SME_SELECT)
    .single();
  if (error) throw new Error(error.message);

  await supabase.from('sme_versions').insert({
    sme_id: data.id,
    version: 1,
    profile: pickProfile(data),
    change_summary: source === 'imported' ? 'Imported' : 'Initial creation',
    created_by: createdBy,
  });

  await embedSme(data);
  return data;
}

// Bulk import. Accepts an array of profiles (or a single object). Each item is
// validated and inserted independently — one bad row doesn't abort the rest.
// Returns { created: [...], errors: [{ index, name, error }] }.
export async function importSmes({
  workspaceId,
  items,
  status = 'active',
  visibility = 'workspace',
  source = 'imported',
  createdBy = null,
}) {
  const list = Array.isArray(items) ? items : [items];
  if (list.length === 0) throw new Error('No SMEs to import');
  if (list.length > 200) throw new Error('Import is capped at 200 SMEs per call');

  const created = [];
  const errors = [];
  for (let i = 0; i < list.length; i += 1) {
    try {
      const sme = await createSme({ workspaceId, profile: list[i], status, visibility, source, createdBy });
      created.push({ id: sme.id, name: sme.name });
    } catch (err) {
      errors.push({ index: i, name: list[i]?.name ?? null, error: err.message });
    }
  }
  return { imported: created.length, failed: errors.length, created, errors };
}

// Parse an import payload (a JSON string) into an array of profiles.
// Accepts a bare array, a single object, or { smes: [...] }.
export function parseImportPayload(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Import payload is not valid JSON');
  }
  const items = Array.isArray(json) ? json : Array.isArray(json?.smes) ? json.smes : [json];
  if (!items.length) throw new Error('No SME objects found in the payload');
  return items;
}

export { LIBRARY_WORKSPACE_ID };
