import { supabase, LIBRARY_WORKSPACE_ID } from '../lib/supabase-admin.js';

export const schema = {
  name: 'list_smes',
  description: 'List Subject Matter Experts. Returns SMEs from the global library and/or a specific workspace. Use search_smes for capability-based discovery.',
  inputSchema: {
    type: 'object',
    properties: {
      workspace_id: { type: 'string', description: 'Filter to a specific workspace (optional)' },
      library_only: { type: 'boolean', description: 'Return only global library SMEs' },
      domain: { type: 'string', description: 'Filter by discipline keyword' },
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },
};

export async function handler({ workspace_id, library_only, domain, limit = 20 }) {
  let query = supabase
    .from('agents')
    .select('id,name,discipline,expertise_level,severity_default,scenario_tags,is_library_sme,usage_count,quality_score,source,workspace_id,created_at')
    .limit(limit)
    .order('quality_score', { ascending: false, nullsFirst: false });

  if (library_only) {
    query = query.eq('is_library_sme', true);
  } else if (workspace_id) {
    query = query.or(`workspace_id.eq.${workspace_id},is_library_sme.eq.true`);
  }

  if (domain) {
    query = query.ilike('discipline', `%${domain}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
