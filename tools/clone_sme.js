import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'clone_sme',
  description: 'Copy a library SME into your workspace and optionally specialize fields for your scenario. Faster and cheaper than generating from scratch.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'source_id'],
    properties: {
      workspace_token: { type: 'string' },
      source_id: { type: 'string', description: 'UUID of the SME to clone' },
      overrides: {
        type: 'object',
        description: 'Fields to override on the clone, e.g. { "adversary_model": "...", "scenario_tags": [...] }',
      },
    },
  },
};

export async function handler({ workspace_token, source_id, overrides = {} }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const { data: source, error: fetchErr } = await supabase
    .from('agents')
    .select('*')
    .eq('id', source_id)
    .single();

  if (fetchErr || !source) throw new Error('Source SME not found');

  const { id, created_at, updated_at, workspace_id: _ws, ...rest } = source;

  const { data, error } = await supabase
    .from('agents')
    .insert({
      ...rest,
      ...overrides,
      workspace_id,
      source: 'cloned',
      is_library_sme: false,
      cloned_from_id: source_id,
      usage_count: 0,
      quality_score: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
