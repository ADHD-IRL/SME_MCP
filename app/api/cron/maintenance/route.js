import { getSupabase } from '../../../../src/lib/supabase.js';
import { embedSme } from '../../../../src/lib/embeddings.js';

// Daily maintenance, invoked by Vercel Cron (see vercel.json).
// Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the
// CRON_SECRET env var is set on the project.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const report = {};

  // 1+2. SQL-side: expire rate-limit windows, recompute recent quality scores
  const { data: maintenance, error: maintErr } = await supabase.rpc('run_maintenance');
  if (maintErr) {
    report.maintenance_error = maintErr.message;
  } else {
    Object.assign(report, maintenance);
  }

  // 3. Embedding backfill: rows missing a vector (new rows whose write-time
  //    embed failed, or rows created before the embed function was deployed).
  const { data: missing, error: missErr } = await supabase
    .from('smes')
    .select('id, name, discipline, persona_description, professional_background, reasoning_style, domain_knowledge, tags')
    .is('embedding', null)
    .neq('status', 'archived')
    .limit(40);

  if (missErr) {
    report.backfill_error = missErr.message;
  } else {
    let embedded = 0;
    for (const row of missing ?? []) {
      if (await embedSme(row)) embedded += 1;
    }
    report.embeddings_backfilled = embedded;
    report.embeddings_pending = (missing?.length ?? 0) - embedded;
  }

  return Response.json({ ok: true, ...report });
}
