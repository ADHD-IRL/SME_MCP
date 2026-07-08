import { getSupabase, LIBRARY_WORKSPACE_ID } from './supabase.js';
import { pickProfile, PROFILE_COLUMNS, SME_SELECT } from './profile.js';
import { embedSme } from './embeddings.js';

// Admin-only curation of the shared library. All operations are scoped to the
// library workspace so an admin can never touch a private workspace SME here.
// Callers must verify isAdminEmail before invoking these.

export async function listLibrarySmes({ status, query } = {}) {
  let q = getSupabase()
    .from('smes')
    .select(SME_SELECT)
    .eq('workspace_id', LIBRARY_WORKSPACE_ID)
    .eq('visibility', 'library');

  if (status && status !== 'all') q = q.eq('status', status);
  if (query) q = q.textSearch('search_vector', query, { type: 'websearch', config: 'english' });

  q = q.order('quality_score', { ascending: false, nullsFirst: false }).order('name');
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export async function getLibrarySme(id) {
  const { data, error } = await getSupabase()
    .from('smes')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', LIBRARY_WORKSPACE_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Library SME not found');
  return data;
}

const ARRAY_FIELDS = new Set(['domain_knowledge', 'tags']);

// Normalize a flat form payload into a profile patch (comma-splitting arrays).
export function formToProfilePatch(getField) {
  const patch = {};
  for (const col of PROFILE_COLUMNS) {
    if (col === 'extensions') continue; // edited elsewhere / left as-is
    const raw = getField(col);
    if (raw == null) continue;
    if (ARRAY_FIELDS.has(col)) {
      patch[col] = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      const v = String(raw).trim();
      if (v) patch[col] = v;
    }
  }
  return patch;
}

export async function updateLibrarySme(id, patch, changeSummary) {
  const supabase = getSupabase();
  const current = await getLibrarySme(id);
  const nextVersion = (current.current_version ?? 1) + 1;

  const { data, error } = await supabase
    .from('smes')
    .update({ ...patch, current_version: nextVersion, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', LIBRARY_WORKSPACE_ID)
    .select(SME_SELECT)
    .single();
  if (error) throw new Error(error.message);

  await supabase.from('sme_versions').insert({
    sme_id: id,
    version: nextVersion,
    profile: pickProfile(data),
    change_summary: changeSummary || 'Admin library edit',
  });

  await embedSme(data);
  return data;
}

export async function setLibraryStatus(id, status) {
  if (!['active', 'deprecated', 'archived'].includes(status)) {
    throw new Error('Invalid status');
  }
  const { error } = await getSupabase()
    .from('smes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', LIBRARY_WORKSPACE_ID);
  if (error) throw new Error(error.message);
}

// Hard removal — versions/feedback cascade. Use archive for anything routine.
export async function deleteLibrarySme(id) {
  const { error } = await getSupabase()
    .from('smes')
    .delete()
    .eq('id', id)
    .eq('workspace_id', LIBRARY_WORKSPACE_ID);
  if (error) throw new Error(error.message);
}
