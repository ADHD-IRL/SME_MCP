import { getSupabase, LIBRARY_WORKSPACE_ID } from './supabase.js';
import { pickProfile, SME_SELECT } from './profile.js';
import { embedSme } from './embeddings.js';

// Shared promotion-queue logic, used by both the review_promotion MCP tool
// and the admin dashboard. `reviewerId` is an api_keys.id (tool) or an
// auth user id (dashboard) — stored on the promotion for the audit trail.

export async function listPendingPromotions(limit = 50) {
  const { data, error } = await getSupabase()
    .from('library_promotions')
    // Disambiguate the embed: library_promotions has two FKs to smes
    // (sme_id and library_sme_id), so name the relationship explicitly.
    .select('id, sme_id, workspace_id, auto_checks, review_notes, created_at, smes!sme_id(name, discipline, persona_description, quality_score, usage_count)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function decidePromotion({ promotionId, decision, notes, reviewerId }) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error("decision must be 'approved' or 'rejected'");
  }
  const supabase = getSupabase();

  const { data: promo, error: promoErr } = await supabase
    .from('library_promotions')
    .select('*')
    .eq('id', promotionId)
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
        created_by: reviewerId ?? null,
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
      created_by: reviewerId ?? null,
    });

    await embedSme(librarySme);
  }

  const { data, error } = await supabase
    .from('library_promotions')
    .update({
      status: decision,
      reviewer: reviewerId ?? null,
      review_notes: notes ?? promo.review_notes,
      library_sme_id: librarySmeId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', promotionId)
    .select('id, status, library_sme_id, reviewed_at')
    .single();
  if (error) throw new Error(error.message);
  return data;
}
