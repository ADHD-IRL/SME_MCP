import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { getOwnedSme } from '../lib/search.js';

export default {
  name: 'archive_sme',
  description:
    'Archive a SME in your workspace. Archived SMEs disappear from listings and search but keep their history and can be restored by an update. This replaces hard deletion.',
  scope: 'write',
  audit: 'sme.archive',
  schema: {
    sme_id: z.string().uuid(),
  },
  async handler({ sme_id }, ctx) {
    await getOwnedSme(sme_id, ctx);
    const { data, error } = await getSupabase()
      .from('smes')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', sme_id)
      .eq('workspace_id', ctx.workspaceId)
      .select('id, name, status')
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
