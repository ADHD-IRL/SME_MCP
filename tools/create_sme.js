import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'create_sme',
  description: 'Create a new SME profile in a workspace. Requires a workspace token.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'profile'],
    properties: {
      workspace_token: { type: 'string', description: 'SME API token for the target workspace' },
      profile: {
        type: 'object',
        required: ['name', 'discipline'],
        description: 'SME profile fields. Required: name, discipline.',
        properties: {
          name: { type: 'string' },
          discipline: { type: 'string' },
          persona_description: { type: 'string' },
          professional_background: { type: 'string' },
          expertise_level: { type: 'string' },
          reasoning_style: { type: 'string' },
          cognitive_bias: { type: 'string' },
          red_team_focus: { type: 'string' },
          severity_default: { type: 'string' },
          epistemic_style: { type: 'string' },
          institutional_background: { type: 'string' },
          conflict_triggers: { type: 'string' },
          decision_style: { type: 'string' },
          adversary_model: { type: 'string' },
          institutional_incentives: { type: 'string' },
          analytical_framework: { type: 'string' },
          source_preferences: { type: 'string' },
          scenario_tags: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

export async function handler({ workspace_token, profile }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const { data, error } = await supabase
    .from('agents')
    .insert({ ...profile, workspace_id, source: 'workspace', is_library_sme: false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
