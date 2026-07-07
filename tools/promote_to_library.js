import { supabase, LIBRARY_WORKSPACE_ID } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'promote_to_library',
  description: 'After a successful session, elevate a workspace SME to the shared global library so other agents can benefit from it.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'agent_id'],
    properties: {
      workspace_token: { type: 'string' },
      agent_id: { type: 'string', description: 'UUID of the workspace SME to promote' },
    },
  },
};

export async function handler({ workspace_token, agent_id }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  if (!LIBRARY_WORKSPACE_ID) throw new Error('LIBRARY_WORKSPACE_ID not configured in MCP server .env');

  const { data: source, error: fetchErr } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agent_id)
    .eq('workspace_id', workspace_id)
    .single();

  if (fetchErr || !source) throw new Error('SME not found in this workspace');

  const { id, created_at, updated_at, ...rest } = source;

  const { data, error } = await supabase
    .from('agents')
    .insert({
      ...rest,
      workspace_id: LIBRARY_WORKSPACE_ID,
      source: 'library',
      is_library_sme: true,
      cloned_from_id: agent_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
