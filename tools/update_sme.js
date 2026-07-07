import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'update_sme',
  description: 'Update fields on an existing SME profile. Requires a workspace token.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'id', 'fields'],
    properties: {
      workspace_token: { type: 'string' },
      id: { type: 'string', description: 'SME agent UUID' },
      fields: { type: 'object', description: 'Partial set of fields to update' },
    },
  },
};

export async function handler({ workspace_token, id, fields }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  // Strip fields that must not be overwritten externally
  const { id: _id, workspace_id: _ws, created_at: _ca, ...safe } = fields;

  const { data, error } = await supabase
    .from('agents')
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', workspace_id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
