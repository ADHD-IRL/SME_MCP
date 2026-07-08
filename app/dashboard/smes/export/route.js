import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../src/lib/supabase-ssr.js';
import { ensureWorkspace } from '../../../../src/lib/workspace.js';
import { exportSmes } from '../../../../src/lib/smes.js';

// Downloads the signed-in user's workspace SMEs as an import-ready JSON file.
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  const includeArchived = new URL(request.url).searchParams.get('archived') === '1';

  try {
    const workspaceId = await ensureWorkspace(user);
    const payload = await exportSmes(workspaceId, { includeArchived });
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="smes-export-${date}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
