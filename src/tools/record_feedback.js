import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { getVisibleSme } from '../lib/search.js';

export default {
  name: 'record_feedback',
  description:
    'Record how well an SME performed in a session (0-100). Feedback is stored as a raw event and rolled into a smoothed quality score that drives search ranking and library-promotion eligibility.',
  scope: 'write',
  audit: 'sme.feedback',
  schema: {
    sme_id: z.string().uuid(),
    score: z.number().min(0).max(100).describe("Score for this SME's contribution to the session"),
    session_id: z.string().optional().describe('Your session identifier, for traceability'),
    dimensions: z.record(z.string(), z.number()).optional()
      .describe('Optional per-dimension scores, e.g. { "accuracy": 90, "novelty": 60 }'),
    notes: z.string().optional(),
  },
  async handler({ sme_id, score, session_id, dimensions, notes }, ctx) {
    const supabase = getSupabase();
    await getVisibleSme(sme_id, ctx); // library SMEs accept feedback from any workspace

    const { error } = await supabase.from('sme_feedback').insert({
      sme_id,
      workspace_id: ctx.workspaceId,
      session_id: session_id ?? null,
      score,
      dimensions: dimensions ?? null,
      notes: notes ?? null,
    });
    if (error) throw new Error(error.message);

    const { error: rpcError } = await supabase.rpc('recompute_sme_quality', { p_sme_id: sme_id });
    if (rpcError) throw new Error(rpcError.message);

    const { data } = await supabase
      .from('smes')
      .select('id, name, usage_count, quality_score')
      .eq('id', sme_id)
      .single();
    return data;
  },
};
