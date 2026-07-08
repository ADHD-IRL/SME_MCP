import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser, isAdminEmail } from '../../src/lib/supabase-ssr.js';
import { ensureWorkspace, getMembership, listKeys } from '../../src/lib/workspace.js';
import { createKeyAction, revokeKeyAction } from './actions.js';

export const metadata = { title: 'Dashboard — SME Library' };
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  await ensureWorkspace(user);
  const membership = await getMembership(user);
  const keys = await listKeys(membership.workspace_id);

  const cookieStore = await cookies();
  const newKey = cookieStore.get('new_key')?.value;
  if (newKey) cookieStore.delete('new_key');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://<this-deployment>';

  return (
    <main style={{ maxWidth: 760, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ marginBottom: 0 }}>API keys</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
          {isAdminEmail(user.email) && <a href="/dashboard/admin">Promotion queue</a>}
          <form action="/auth/signout" method="post">
            <button style={linkBtn}>Sign out</button>
          </form>
        </div>
      </div>
      <p style={{ color: '#555', marginTop: 4 }}>
        {user.email} · workspace <code>{membership.workspaces?.name}</code> ({membership.workspaces?.plan})
      </p>

      {newKey && (
        <div style={{ background: '#eef6ec', border: '1px solid #bcd', borderRadius: 8, padding: '1rem', margin: '1rem 0' }}>
          <strong>New key — copy it now, it won't be shown again:</strong>
          <pre style={{ background: '#fff', padding: '0.6rem', borderRadius: 6, overflowX: 'auto', marginBottom: 0 }}>{newKey}</pre>
        </div>
      )}

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem 1.25rem', margin: '1.5rem 0' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Create a key</h2>
        <form action={createKeyAction} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <label>
            Name
            <input name="name" placeholder="e.g. CI pipeline" style={{ display: 'block', marginTop: 4, padding: '0.45rem', border: '1px solid #ccc', borderRadius: 6 }} />
          </label>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ padding: 0, fontSize: '0.85rem', color: '#555' }}>Scopes</legend>
            <label style={{ marginRight: 12 }}><input type="checkbox" name="scope_read" defaultChecked /> read</label>
            <label style={{ marginRight: 12 }}><input type="checkbox" name="scope_write" defaultChecked /> write</label>
            <label><input type="checkbox" name="scope_promote" /> promote</label>
          </fieldset>
          <button style={primaryBtn}>Create key</button>
        </form>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={th}>Name</th><th style={th}>Prefix</th><th style={th}>Scopes</th>
            <th style={th}>Status</th><th style={th}>Last used</th><th style={th} />
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 && (
            <tr><td colSpan={6} style={{ padding: '1rem', color: '#888' }}>No keys yet.</td></tr>
          )}
          {keys.map((k) => {
            const revoked = Boolean(k.revoked_at);
            return (
              <tr key={k.id} style={{ borderBottom: '1px solid #f2f2f2', opacity: revoked ? 0.5 : 1 }}>
                <td style={td}>{k.name}</td>
                <td style={td}><code>{k.key_prefix}…</code></td>
                <td style={td}>{k.scopes.join(', ')}</td>
                <td style={td}>{revoked ? 'revoked' : 'active'}</td>
                <td style={td}>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : '—'}</td>
                <td style={td}>
                  {!revoked && (
                    <form action={revokeKeyAction}>
                      <input type="hidden" name="key_id" value={k.id} />
                      <button style={linkBtn}>Revoke</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Connect</h2>
        <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: 8, overflowX: 'auto' }}>{`claude mcp add --transport http sme-library \\
  ${baseUrl}/api/mcp \\
  --header "Authorization: Bearer <your-key>"`}</pre>
      </section>
    </main>
  );
}

const th = { padding: '0.5rem 0.4rem' };
const td = { padding: '0.5rem 0.4rem' };
const primaryBtn = { padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: '#111', color: '#fff', cursor: 'pointer' };
const linkBtn = { background: 'none', border: 'none', color: '#a12', cursor: 'pointer', padding: 0, textDecoration: 'underline' };
