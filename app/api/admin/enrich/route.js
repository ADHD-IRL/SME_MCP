import { getCurrentUser } from '../../../../src/lib/supabase-ssr.js';
import { isAdmin } from '../../../../src/lib/admins.js';
import { libraryCount, libraryDisciplines, enrichLibraryPage } from '../../../../src/lib/admin-library.js';

// Admin-only, batched build-out of every SME field across the shared library.
// The browser drives the loop (small pages) so each request stays well under
// the function time limit and the user sees progress.
export const maxDuration = 60;

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isAdmin(user))) return Response.json({ error: 'admin access required' }, { status: 403 });

  let body = {};
  try { body = await request.json(); } catch { /* defaults */ }
  const offset = Math.max(0, Number(body.offset) || 0);
  const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 50);

  try {
    const total = await libraryCount();
    const disciplines = await libraryDisciplines();
    const { processed, updated } = await enrichLibraryPage({ offset, limit }, disciplines);
    const nextOffset = offset + processed;
    return Response.json({ total, processed, updated, nextOffset, done: nextOffset >= total || processed === 0 });
  } catch (err) {
    return Response.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
