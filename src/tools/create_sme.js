import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { profileShape, pickProfile, SME_SELECT } from '../lib/profile.js';

export default {
  name: 'create_sme',
  description:
    'Create a new SME profile in your workspace. Search the library first — clone_sme is cheaper than authoring a duplicate.',
  scope: 'write',
  audit: 'sme.create',
  schema: {
    profile: z.object(profileShape).describe('The SME profile'),
    status: z.enum(['draft', 'active']).default('active'),
  },
  async handler({ profile, status }, ctx) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('smes')
      .insert({
        ...profile,
        workspace_id: ctx.workspaceId,
        status,
        visibility: 'workspace',
        source: 'user',
        created_by: ctx.keyId,
      })
      .select(SME_SELECT)
      .single();
    if (error) throw new Error(error.message);

    await supabase.from('sme_versions').insert({
      sme_id: data.id,
      version: 1,
      profile: pickProfile(data),
      change_summary: 'Initial creation',
      created_by: ctx.keyId,
    });

    return data;
  },
};
