import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'record_session_quality',
  description: 'After a session completes, record how well an SME performed. Increments usage_count and updates quality_score as a rolling average.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'agent_id', 'quality_score'],
    properties: {
      workspace_token: { type: 'string' },
      agent_id: { type: 'string' },
      session_id: { type: 'string', description: 'Session UUID (for reference)' },
      quality_score: { type: 'number', description: 'Score 0-100 for this SME\'s contribution' },
    },
  },
};

export async function handler({ workspace_token, agent_id, quality_score }) {
  const { permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const score = Math.min(100, Math.max(0, quality_score));

  const { data: agent, error: fetchErr } = await supabase
    .from('agents')
    .select('usage_count, quality_score')
    .eq('id', agent_id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const prevCount = agent.usage_count || 0;
  const prevScore = agent.quality_score ?? score;
  const newCount = prevCount + 1;
  // Rolling average
  const newScore = Math.round(((prevScore * prevCount) + score) / newCount * 10) / 10;

  const { data, error } = await supabase
    .from('agents')
    .update({ usage_count: newCount, quality_score: newScore })
    .eq('id', agent_id)
    .select('id, usage_count, quality_score')
    .single();

  if (error) throw new Error(error.message);
  return data;
}
