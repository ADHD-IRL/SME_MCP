import { supabase } from './supabase-admin.js';

export async function searchSmes({ capability, tags, domain, min_expertise, library_only, workspace_id, limit = 10 }) {
  let query = supabase
    .from('agents')
    .select('id,name,discipline,persona_description,red_team_focus,analytical_framework,scenario_tags,domain_expertise,is_library_sme,usage_count,quality_score,expertise_level,severity_default,cognitive_bias,epistemic_style,adversary_model,source,workspace_id,created_at');

  // Scope: library only, workspace only, or both
  if (library_only) {
    query = query.eq('is_library_sme', true);
  } else if (workspace_id) {
    query = query.or(`workspace_id.eq.${workspace_id},is_library_sme.eq.true`);
  }

  // Tag filter
  if (tags && tags.length > 0) {
    query = query.contains('scenario_tags', tags);
  }

  // Min expertise filter
  if (min_expertise) {
    const levels = ['Junior', 'Mid-level', 'Senior', 'Expert', 'Principal'];
    const minIdx = levels.findIndex(l => l.toLowerCase() === min_expertise.toLowerCase());
    if (minIdx > 0) {
      const acceptable = levels.slice(minIdx);
      query = query.in('expertise_level', acceptable);
    }
  }

  // Text search via postgres full-text (capability)
  if (capability) {
    const tsQuery = capability.trim().split(/\s+/).join(' & ');
    query = query.textSearch(
      'agents_sme_search_idx',
      tsQuery,
      { type: 'websearch', config: 'english' }
    );
  }

  query = query
    .order('quality_score', { ascending: false, nullsFirst: false })
    .order('usage_count', { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`Search failed: ${error.message}`);
  return data || [];
}
