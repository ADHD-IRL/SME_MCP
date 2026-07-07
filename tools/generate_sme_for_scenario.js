import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';
import { generateSmeProfile } from '../lib/anthropic.js';

export const schema = {
  name: 'generate_sme_for_scenario',
  description: 'When the library has no good match, generate fresh SME profiles using AI tailored to your specific scenario. Creates and persists the profiles so they can be promoted to the library later.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'scenario_name', 'scenario_description'],
    properties: {
      workspace_token: { type: 'string' },
      scenario_name: { type: 'string', description: 'Name of the scenario' },
      scenario_description: { type: 'string', description: 'Detailed scenario description' },
      scenario_tags: { type: 'array', items: { type: 'string' }, description: 'Tags for discoverability' },
      required_disciplines: { type: 'array', items: { type: 'string' }, description: 'List of disciplines/expertise needed' },
      count: { type: 'number', description: 'Number of SMEs to generate (default 2, max 5)' },
    },
  },
};

export async function handler({ workspace_token, scenario_name, scenario_description, scenario_tags = [], required_disciplines = [], count = 2 }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const n = Math.min(count, 5);

  // Build expert types from required_disciplines or let AI decide
  const expertTypes = required_disciplines.length > 0
    ? required_disciplines.slice(0, n)
    : Array.from({ length: n }, (_, i) => `Expert ${i + 1} for: ${scenario_name}`);

  const profiles = await Promise.all(
    expertTypes.map(discipline =>
      generateSmeProfile({
        expert_type: discipline,
        key_focus: scenario_name,
        prior_background: `Relevant to: ${scenario_description.slice(0, 300)}`,
      })
    )
  );

  const toInsert = profiles.map(p => ({
    ...p,
    workspace_id,
    source: 'generated',
    is_library_sme: false,
    scenario_tags: [...(p.tags || []), ...scenario_tags],
    usage_count: 0,
    quality_score: null,
  }));

  const { data, error } = await supabase.from('agents').insert(toInsert).select();
  if (error) throw new Error(error.message);
  return data;
}
