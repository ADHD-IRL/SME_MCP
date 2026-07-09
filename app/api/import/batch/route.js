import { getCurrentUser, isAdminEmail } from '../../../../src/lib/supabase-ssr.js';
import { ensureWorkspace } from '../../../../src/lib/workspace.js';
import { createSme, LIBRARY_WORKSPACE_ID } from '../../../../src/lib/smes.js';

// Inserts one batch of parsed SME profiles. The browser drives the loop and
// tracks progress, so each request stays small and well under function limits.
export const maxDuration = 60;

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'items must be a non-empty array' }, { status: 400 });
  }
  if (items.length > 25) {
    return Response.json({ error: 'batch is capped at 25 items' }, { status: 400 });
  }

  const toLibrary = body?.toLibrary === true && isAdminEmail(user.email);
  const workspaceId = toLibrary ? LIBRARY_WORKSPACE_ID : await ensureWorkspace(user);
  const visibility = toLibrary ? 'library' : 'workspace';

  let succeeded = 0;
  const errors = [];
  for (let i = 0; i < items.length; i += 1) {
    try {
      await createSme({ workspaceId, profile: items[i], visibility, source: 'imported', createdBy: null });
      succeeded += 1;
    } catch (err) {
      errors.push({ name: items[i]?.name ?? null, error: String(err?.message ?? err) });
    }
  }

  return Response.json({ succeeded, failed: errors.length, errors });
}
