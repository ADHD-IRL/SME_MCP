import { z } from 'zod';
import { getSupabase, LIBRARY_WORKSPACE_ID } from '../lib/supabase.js';
import { pickProfile, SME_SELECT } from '../lib/profile.js';
import { embedSme } from '../lib/embeddings.js';

export default {
  name: 'review_promotion',
  description:
    'Admin: approve or reject a pending library promotion. Approval copies the SME into the shared library as an immutable entry with lineage to the source. Omit promotion_id to list the pending queue.',
  scope: 'admin',
  audit: 'promotion.review',
  schema: {
    promotion_id: z.string().uuid().optional().describe('Pending promotion to decide; omit to list the queue'),
    decision: z.enum(['approved', 'rejected']).optional(),
    notes: z.string().optional(),
  },
  async handler({ promotion_id, decision, notes }, ctx) {
    const supabase = getSupabase();

    if (!promotion_id) {
      const { data, error } = await supabase
        .from('library_promotions')
        .select('id, sme_id, workspace_id, auto_checks, review_notes, created_at, smes(name, discipline, quality_score, usage_count)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw new Error(error.message);
      return { pending: data };
    }

    if (!decision) throw new Error('decision is required when promotion_id is given');

    const { data: promo, error: promoErr } = await supabase
      .from('library_promotions')
      .select('*')
      .eq('id', promotion_id)
      .eq('status', 'pending')
      .maybeSingle();
    if (promoErr) throw new Error(promoErr.message);
    if (!promo) throw new Error('Pending promotion not found');

    let librarySmeId = null;
    if (decision === 'approved') {
      const { data: source, error: srcErr } = await supabase
        .from('smes')
        .select('*')
        .eq('id', promo.sme_id)
        .single();
      if (srcErr) throw new Error(srcErr.message);

      const { data: librarySme, error: insErr } = await supabase
        .from('smes')
        .insert({
          ...pickProfile(source),
          workspace_id: LIBRARY_WORKSPACE_ID,
          status: 'active',
          visibility: 'library',
          source: 'promoted',
          cloned_from_id: source.id,
          quality_score: source.quality_score,
          usage_count: source.usage_count,
          created_by: ctx.keyId,
        })
        .select(SME_SELECT)
        .single();
      if (insErr) throw new Error(insErr.message);
      librarySmeId = librarySme.id;

      await supabase.from('sme_versions').insert({
        sme_id: librarySmeId,
        version: 1,
        profile: pickProfile(librarySme),
        change_summary: `Promoted to library from ${source.id}`,
        created_by: ctx.keyId,
      });

      await embedSme(librarySme);
    }

    const { data, error } = await supabase
      .from('library_promotions')
      .update({
        status: decision,
        reviewer: ctx.keyId,
        review_notes: notes ?? promo.review_notes,
        library_sme_id: librarySmeId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', promotion_id)
      .select('id, status, library_sme_id, reviewed_at')
      .single();
    if (error) throw new Error(error.message);

    return data;
  },
};
