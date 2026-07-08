import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { getVisibleSme } from '../lib/search.js';
import { pickProfile, SME_SELECT } from '../lib/profile.js';
import { embedSme } from '../lib/embeddings.js';

export default {
  name: 'clone_sme',
  description:
    'Copy a library SME (or one of your own) into your workspace as an editable private copy, preserving lineage to the original.',
  scope: 'write',
  audit: 'sme.clone',
  schema: {
    sme_id: z.string().uuid().describe('UUID of the SME to clone'),
    name: z.string().optional().describe('Optional new name for the copy'),
  },
  async handler({ sme_id, name }, ctx) {
    const supabase = getSupabase();
    const source = await getVisibleSme(sme_id, ctx);

    const profile = pickProfile(source);
    if (name) profile.name = name;

    const { data, error } = await supabase
      .from('smes')
      .insert({
        ...profile,
        workspace_id: ctx.workspaceId,
        status: 'active',
        visibility: 'workspace',
        source: 'cloned',
        cloned_from_id: source.id,
        created_by: ctx.keyId,
      })
      .select(SME_SELECT)
      .single();
    if (error) throw new Error(error.message);

    await supabase.from('sme_versions').insert({
      sme_id: data.id,
      version: 1,
      profile: pickProfile(data),
      change_summary: `Cloned from ${source.id}`,
      created_by: ctx.keyId,
    });

    await embedSme(data);
    return data;
  },
};
