import { getSupabase, LIBRARY_WORKSPACE_ID } from './supabase.js';
import { EXPERTISE_LEVELS, SME_SELECT } from './profile.js';
import { embedText } from './embeddings.js';

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

// Semantic search: embed the query, vector-match via RPC, hydrate rows.
// Returns null when the embedding service is unavailable (caller falls back).
async function semanticSearch({ query, scope = 'all', limit = 10 }, ctx) {
  const embedding = await embedText(query);
  if (!embedding) return null;

  const supabase = getSupabase();
  const { data: matches, error } = await supabase.rpc('match_smes', {
    p_embedding: JSON.stringify(embedding),
    p_workspace_id: ctx.workspaceId,
    p_scope: scope,
    p_limit: Math.min(limit * 2, 50),
  });
  if (error || !matches?.length) return error ? null : [];

  const { data: rows, error: rowErr } = await supabase
    .from('smes')
    .select(SME_SELECT)
    .in('id', matches.map((m) => m.id));
  if (rowErr) return null;

  const byId = new Map(rows.map((r) => [r.id, r]));
  return matches
    .map((m) => {
      const row = byId.get(m.id);
      return row ? { ...row, similarity: Math.round(m.similarity * 1000) / 1000 } : null;
    })
    .filter(Boolean)
    .slice(0, limit);
}

// Hybrid: reciprocal rank fusion of keyword FTS and vector similarity,
// with post-filters (tags/expertise) applied by the keyword leg. Degrades
// to pure keyword when there's no query or no embedding service.
export async function hybridSearch(args, ctx) {
  const { query, limit = 10, mode = 'hybrid' } = args;

  if (!query || mode === 'keyword') {
    return { mode: 'keyword', results: await searchSmes(args, ctx) };
  }

  if (mode === 'semantic') {
    const semantic = await semanticSearch(args, ctx);
    if (semantic === null) {
      return { mode: 'keyword', note: 'embedding service unavailable; fell back to keyword', results: await searchSmes(args, ctx) };
    }
    return { mode: 'semantic', results: semantic };
  }

  const [keyword, semantic] = await Promise.all([
    searchSmes({ ...args, limit: Math.min(limit * 2, 50) }, ctx),
    semanticSearch(args, ctx),
  ]);
  if (semantic === null || semantic.length === 0) {
    return { mode: 'keyword', results: keyword.slice(0, limit) };
  }

  // RRF: score = Σ 1/(k + rank), k=60
  const K = 60;
  const scores = new Map();
  const rows = new Map();
  for (const [list, weight] of [[keyword, 1], [semantic, 1]]) {
    list.forEach((row, i) => {
      rows.set(row.id, { ...rows.get(row.id), ...row });
      scores.set(row.id, (scores.get(row.id) ?? 0) + weight / (K + i + 1));
    });
  }

  const fused = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => rows.get(id));
  return { mode: 'hybrid', results: fused };
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
