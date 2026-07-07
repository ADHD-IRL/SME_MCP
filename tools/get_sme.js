import { supabase } from '../lib/supabase-admin.js';

export const schema = {
  name: 'get_sme',
  description: 'Get the full profile of a specific SME by ID, including all extended fields.',
  inputSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'SME agent UUID' },
    },
  },
};

export async function handler({ id }) {
  const { data, error } = await supabase.from('agents').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}
