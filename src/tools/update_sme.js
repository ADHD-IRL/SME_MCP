import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { getOwnedSme } from '../lib/search.js';
import { profileShape, pickProfile, SME_SELECT } from '../lib/profile.js';
import { embedSme } from '../lib/embeddings.js';

const updatableShape = Object.fromEntries(
  Object.entries(profileShape).map(([k, v]) => [k, v.optional()])
);

export default {
  name: 'update_sme',
  description:
    'Update a SME in your workspace. Each update snapshots the previous state into version history, so changes are reversible. Library SMEs cannot be edited directly — clone first.',
  scope: 'write',
  audit: 'sme.update',
  schema: {
    sme_id: z.string().uuid(),
    updates: z.object(updatableShape).describe('Profile fields to change'),
    change_summary: z.string().optional().describe('One line on what changed and why'),
    status: z.enum(['draft', 'active', 'deprecated']).optional(),
  },
  async handler({ sme_id, updates, change_summary, status }, ctx) {
    const supabase = getSupabase();
    const current = await getOwnedSme(sme_id, ctx);
    if (current.visibility === 'library') {
      throw new Error('Library SMEs are immutable; clone_sme into your workspace instead');
    }

    const nextVersion = (current.current_version ?? 1) + 1;
    const patch = { ...updates, current_version: nextVersion, updated_at: new Date().toISOString() };
    if (status) patch.status = status;

    const { data, error } = await supabase
      .from('smes')
      .update(patch)
      .eq('id', sme_id)
      .eq('workspace_id', ctx.workspaceId)
      .select(SME_SELECT)
      .single();
    if (error) throw new Error(error.message);

    await supabase.from('sme_versions').insert({
      sme_id,
      version: nextVersion,
      profile: pickProfile(data),
      change_summary: change_summary ?? null,
      created_by: ctx.keyId,
    });

    await embedSme(data);
    return data;
  },
};
