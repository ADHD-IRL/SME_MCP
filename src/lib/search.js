import { getSupabase, LIBRARY_WORKSPACE_ID } from './supabase.js';
import { EXPERTISE_LEVELS, SME_SELECT } from './profile.js';

// Scope an SME query to what the caller may see: the shared library plus
// their own workspace ('all'), or either one alone.
export function scopeQuery(query, scope, workspaceId) {
  if (scope === 'library') {
    return query.eq('visibility', 'library');
  }
  if (scope === 'workspace') {
    return query.eq('workspace_id', workspaceId);
  }
  return query.or(`workspace_id.eq.${workspaceId},visibility.eq.library`);
}

export async function searchSmes({ query, tags, min_expertise, scope = 'all', limit = 10 }, ctx) {
  const supabase = getSupabase();
  let q = supabase.from('smes').select(SME_SELECT).neq('status', 'archived');

  q = scopeQuery(q, scope, ctx.workspaceId);

  if (tags?.length) q = q.contains('tags', tags);

  if (min_expertise) {
    const idx = EXPERTISE_LEVELS.findIndex(
      (l) => l.toLowerCase() === min_expertise.toLowerCase()
    );
    if (idx > 0) q = q.in('expertise_level', EXPERTISE_LEVELS.slice(idx));
  }

  if (query) {
    q = q.textSearch('search_vector', query, { type: 'websearch', config: 'english' });
  }

  q = q
    .order('quality_score', { ascending: false, nullsFirst: false })
    .order('usage_count', { ascending: false })
    .limit(Math.min(limit, 50));

  const { data, error } = await q;
  if (error) throw new Error(`Search failed: ${error.message}`);
  return data ?? [];
}

// Fetch one SME the caller is allowed to see (own workspace or library).
export async function getVisibleSme(smeId, ctx) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('smes')
    .select(SME_SELECT)
    .eq('id', smeId)
    .or(`workspace_id.eq.${ctx.workspaceId},visibility.eq.library`)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('SME not found or not visible to this workspace');
  return data;
}

// Fetch one SME the caller owns (required for writes).
export async function getOwnedSme(smeId, ctx) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('smes')
    .select('*')
    .eq('id', smeId)
    .eq('workspace_id', ctx.workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('SME not found in this workspace');
  return data;
}

export { LIBRARY_WORKSPACE_ID };
