import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../../src/lib/supabase-ssr.js';
import { isAdmin } from '../../../../src/lib/admins.js';
import { listLibrarySmes } from '../../../../src/lib/admin-library.js';
import { listPendingPromotions } from '../../../../src/lib/promotions.js';
import LibraryConsole from './LibraryConsole.jsx';
import {
  setStatusAction, deleteLibraryAction, updateLibraryAction,
  bulkStatusAction, bulkDeleteAction, decidePromotionAction,
} from './actions.js';

export const metadata = { title: 'Library console — SME Library' };
export const dynamic = 'force-dynamic';

export default async function LibraryAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isAdmin(user))) {
    return (
      <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem' }}>
        <h1>Library console</h1>
        <p style={{ color: 'var(--app-danger)' }}>Admin access required.</p>
        <p><a href="/dashboard">← Back to dashboard</a></p>
      </main>
    );
  }

  let smes = [];
  let pending = [];
  let loadError = null;
  try {
    smes = await listLibrarySmes({ status: 'all' });
    pending = await listPendingPromotions();
  } catch (err) {
    loadError = err.message;
  }

  return (
    <main style={{ maxWidth: 960, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ marginBottom: 0 }}>Library console</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/dashboard/admin">Promotion queue</a>
          <a href="/dashboard">Dashboard</a>
        </div>
      </div>
      <p style={{ color: 'var(--app-muted)', marginTop: 4 }}>
        View, filter, organize, edit, and moderate the shared library.
      </p>

      {loadError ? (
        <div style={{ background: 'var(--app-danger-bg)', border: '1px solid var(--app-danger-border)', borderRadius: 8, padding: '0.8rem 1rem', margin: '1rem 0', fontSize: '0.9rem' }}>
          <strong>Couldn't load the library.</strong> Apply the pending database migration
          (<code>supabase db push</code>). Details: <code>{loadError}</code>
        </div>
      ) : (
        <LibraryConsole
          smes={smes}
          pending={pending}
          actions={{ setStatusAction, deleteLibraryAction, updateLibraryAction, bulkStatusAction, bulkDeleteAction, decidePromotionAction }}
        />
      )}
    </main>
  );
}
