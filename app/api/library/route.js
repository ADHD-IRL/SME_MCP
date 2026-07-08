import { getSupabase } from '../../../src/lib/supabase.js';
import { SME_SELECT } from '../../../src/lib/profile.js';

// Public, unauthenticated, read-only browse of the shared library — the
// product's cheap "front door". CDN-cached at the edge since the library
// only changes when a promotion is approved.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = Math.min(Number(searchParams.get('limit')) || 25, 100);

  let data, error;
  try {
    let query = getSupabase()
      .from('smes')
      .select(SME_SELECT)
      .eq('visibility', 'library')
      .eq('status', 'active');

    if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' });

    query = query
      .order('quality_score', { ascending: false, nullsFirst: false })
      .order('usage_count', { ascending: false })
      .limit(limit);

    ({ data, error } = await query);
  } catch (err) {
    error = { message: String(err?.message ?? err) };
  }
  if (error) return Response.json({ error: error.message }, { status: 503 });

  return Response.json(
    { count: data.length, smes: data },
    {
      headers: {
        // Serve stale for up to a day while revalidating in the background.
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    }
  );
}
