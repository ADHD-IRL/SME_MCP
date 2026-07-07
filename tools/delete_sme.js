import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'delete_sme',
  description: 'Delete an SME from a workspace. Cannot delete library SMEs this way.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'id'],
    properties: {
      workspace_token: { type: 'string' },
      id: { type: 'string', description: 'SME agent UUID' },
    },
  },
};

export async function handler({ workspace_token, id }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspace_id)
    .eq('is_library_sme', false);

  if (error) throw new Error(error.message);
  return { deleted: true, id };
}
