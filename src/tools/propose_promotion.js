import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { getOwnedSme, hybridSearch } from '../lib/search.js';

const MIN_USAGE = 3;
const MIN_QUALITY = 70;

export default {
  name: 'propose_promotion',
  description:
    'Propose one of your workspace SMEs for the shared public library. Automated gates check usage, quality, and duplication; if they pass, the proposal enters a moderation queue for review.',
  scope: 'write',
  audit: 'promotion.propose',
  schema: {
    sme_id: z.string().uuid().describe('UUID of the workspace SME to propose'),
    notes: z.string().optional().describe('Why this SME belongs in the shared library'),
  },
  async handler({ sme_id, notes }, ctx) {
    const supabase = getSupabase();
    const sme = await getOwnedSme(sme_id, ctx);

    if (sme.visibility === 'library') throw new Error('This SME is already in the library');
    if (sme.status !== 'active') throw new Error('Only active SMEs can be proposed for the library');

    const { data: existing } = await supabase
      .from('library_promotions')
      .select('id, status')
      .eq('sme_id', sme_id)
      .eq('status', 'pending')
      .maybeSingle();
    if (existing) return { promotion_id: existing.id, status: 'pending', message: 'Already in the review queue' };

    // Automated gates
    const checks = {
      min_usage: { required: MIN_USAGE, actual: sme.usage_count, pass: sme.usage_count >= MIN_USAGE },
      min_quality: { required: MIN_QUALITY, actual: sme.quality_score, pass: (sme.quality_score ?? 0) >= MIN_QUALITY },
    };

    const { results: similar } = await hybridSearch(
      { query: `${sme.name} ${sme.discipline} ${sme.persona_description ?? ''}`.trim(), scope: 'library', limit: 3 },
      ctx
    );
    checks.dedup = {
      similar: similar.map((s) => ({ id: s.id, name: s.name, discipline: s.discipline, similarity: s.similarity })),
      pass: !similar.some(
        (s) =>
          (s.similarity ?? 0) >= 0.9 ||
          s.discipline?.toLowerCase() === sme.discipline?.toLowerCase()
      ),
    };

    const failed = Object.entries(checks).filter(([, c]) => !c.pass).map(([k]) => k);
    if (failed.length) {
      return {
        accepted: false,
        failed_checks: failed,
        checks,
        message:
          'Not yet eligible for the library. Build up usage and quality via record_feedback, or check whether a similar library SME already covers this discipline.',
      };
    }

    const { data, error } = await supabase
      .from('library_promotions')
      .insert({
        sme_id,
        workspace_id: ctx.workspaceId,
        status: 'pending',
        auto_checks: checks,
        review_notes: notes ?? null,
      })
      .select('id, status, created_at')
      .single();
    if (error) throw new Error(error.message);

    return { accepted: true, promotion: data, checks, message: 'Queued for library review' };
  },
};
