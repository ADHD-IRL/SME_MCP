import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../../../src/lib/supabase-ssr.js';
import { isAdmin, isAdminEmail, listAdmins, listAppUsers } from '../../../src/lib/admins.js';
import { ensureWorkspace, getMembership } from '../../../src/lib/workspace.js';
import {
  updatePasswordAction, dismissAccountFlashAction,
  grantAdminAction, revokeAdminAction,
} from './actions.js';
import AdminManager from './AdminManager.jsx';

export const metadata = { title: 'Account — SME Library' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  await ensureWorkspace(user);
  const membership = await getMembership(user);
  const admin = await isAdmin(user);

  const store = await cookies();
  const flash = store.get('account_flash')?.value;

  // Admin management data (admins only).
  let users = [];
  let adminLoadError = null;
  if (admin) {
    try {
      const [all, dbAdmins] = await Promise.all([listAppUsers(), listAdmins()]);
      const dbAdminIds = new Set(dbAdmins.map((a) => a.user_id));
      users = all
        .map((u) => ({
          ...u,
          isEnvAdmin: isAdminEmail(u.email),
          isDbAdmin: dbAdminIds.has(u.id),
        }))
        .sort((a, b) => {
          const rank = (x) => (x.isEnvAdmin || x.isDbAdmin ? 0 : 1);
          return rank(a) - rank(b) || (a.email || '').localeCompare(b.email || '');
        });
    } catch (err) {
      adminLoadError = err.message;
    }
  }

  const isError = flash?.startsWith('Error:');

  return (
    <main style={{ maxWidth: 760, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ marginBottom: 0 }}>Account</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
          <a href="/dashboard">API keys</a>
          <a href="/dashboard/smes">My SMEs</a>
          {admin && <a href="/dashboard/admin/library">Library</a>}
        </div>
      </div>

      {flash && (
        <div style={{
          background: isError ? 'var(--app-danger-bg)' : 'var(--app-ok-bg)',
          border: `1px solid ${isError ? 'var(--app-danger-border)' : 'var(--app-line)'}`,
          borderRadius: 8, padding: '0.7rem 1rem', margin: '1rem 0', fontSize: '0.9rem',
          display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center',
        }}>
          <span style={{ color: isError ? 'var(--app-danger)' : 'var(--app-ink)' }}>{flash}</span>
          <form action={dismissAccountFlashAction}>
            <button style={linkBtn}>dismiss</button>
          </form>
        </div>
      )}

      {/* Profile */}
      <section style={card}>
        <h2 style={h2}>Profile</h2>
        <Row label="Email" value={user.email} />
        <Row label="Workspace" value={`${membership?.workspaces?.name || '—'} (${membership?.workspaces?.plan || '—'})`} />
        <Row label="Role" value={admin ? 'Admin' : 'Member'} />
        <Row label="Member since" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'} />
        <div style={{ marginTop: 14 }}>
          <form action="/auth/signout" method="post">
            <button style={btnOutline}>Sign out</button>
          </form>
        </div>
      </section>

      {/* Change password */}
      <section style={card}>
        <h2 style={h2}>Change password</h2>
        <form action={updatePasswordAction} style={{ display: 'grid', gap: 10, maxWidth: 360 }}>
          <label style={label}>
            New password
            <input type="password" name="password" autoComplete="new-password" required minLength={8} style={input} />
          </label>
          <label style={label}>
            Confirm new password
            <input type="password" name="confirm" autoComplete="new-password" required minLength={8} style={input} />
          </label>
          <div><button style={btnPrimary}>Update password</button></div>
          <p style={{ fontSize: '0.78rem', color: 'var(--app-faint)', margin: 0 }}>At least 8 characters.</p>
        </form>
      </section>

      {/* Admin management */}
      {admin && (
        <section style={card}>
          <h2 style={h2}>Admins</h2>
          <p style={{ color: 'var(--app-muted)', marginTop: 0, fontSize: '0.9rem' }}>
            Grant or revoke admin access for any signed-up user. Admins can moderate
            promotions and manage the shared library. Users listed via the
            {' '}<code>ADMIN_EMAILS</code> environment variable are always admins and
            can't be revoked here (that's the lockout-proof bootstrap).
          </p>
          {adminLoadError ? (
            <div style={{ background: 'var(--app-danger-bg)', border: '1px solid var(--app-danger-border)', borderRadius: 8, padding: '0.8rem 1rem', fontSize: '0.88rem' }}>
              <strong>Couldn't load users.</strong> Apply the latest database migration
              (<code>supabase/migrations/007_app_admins.sql</code> or{' '}
              <code>supabase/apply-latest.sql</code>). Details: <code>{adminLoadError}</code>
            </div>
          ) : (
            <AdminManager
              users={users}
              currentUserId={user.id}
              grantAction={grantAdminAction}
              revokeAction={revokeAdminAction}
            />
          )}
        </section>
      )}
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, padding: '3px 0', fontSize: '0.9rem' }}>
      <div style={{ color: 'var(--app-muted)' }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

const card = { border: '1px solid var(--app-line)', borderRadius: 12, padding: '1.1rem 1.25rem', margin: '1.4rem 0', background: 'var(--app-card)' };
const h2 = { marginTop: 0, fontSize: '1.1rem' };
const label = { fontSize: '0.82rem', color: 'var(--app-muted)', display: 'grid', gap: 4 };
const input = { padding: '0.5rem 0.7rem', border: '1px solid var(--app-line)', borderRadius: 8, background: 'var(--app-card)', color: 'var(--app-ink)', boxSizing: 'border-box' };
const btnPrimary = { padding: '0.5rem 1.1rem', border: 'none', borderRadius: 6, background: 'var(--app-accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 };
const btnOutline = { padding: '0.45rem 1rem', border: '1px solid var(--app-line)', borderRadius: 6, background: 'var(--app-card)', color: 'var(--app-ink)', cursor: 'pointer' };
const linkBtn = { background: 'none', border: 'none', color: 'var(--app-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem', padding: 0 };
