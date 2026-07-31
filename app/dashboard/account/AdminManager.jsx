'use client';

import { useMemo, useState } from 'react';

const S = {
  input: { padding: '0.5rem 0.7rem', border: '1px solid var(--app-line)', borderRadius: 8, background: 'var(--app-card)', color: 'var(--app-ink)', boxSizing: 'border-box' },
  btn: { padding: '0.35rem 0.8rem', border: '1px solid var(--app-line)', borderRadius: 6, background: 'var(--app-card)', color: 'var(--app-ink)', cursor: 'pointer', fontSize: '0.82rem' },
  btnPrimary: { padding: '0.35rem 0.8rem', border: 'none', borderRadius: 6, background: 'var(--app-accent)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
  btnDanger: { padding: '0.35rem 0.8rem', border: '1px solid var(--app-danger)', borderRadius: 6, background: 'var(--app-card)', color: 'var(--app-danger)', cursor: 'pointer', fontSize: '0.82rem' },
  badge: (kind) => ({
    fontSize: '0.7rem', fontWeight: 600, padding: '1px 8px', borderRadius: 10,
    background: kind === 'env' ? 'var(--app-sel-bg)' : 'var(--app-ok-bg)',
    color: kind === 'env' ? 'var(--app-accent-ink)' : 'var(--app-ok)',
    border: '1px solid var(--app-line)', whiteSpace: 'nowrap',
  }),
};

export default function AdminManager({ users, currentUserId, grantAction, revokeAction }) {
  const [q, setQ] = useState('');
  const [onlyAdmins, setOnlyAdmins] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (onlyAdmins && !(u.isEnvAdmin || u.isDbAdmin)) return false;
      if (!term) return true;
      return (u.email || '').toLowerCase().includes(term);
    });
  }, [users, q, onlyAdmins]);

  const adminCount = users.filter((u) => u.isEnvAdmin || u.isDbAdmin).length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${users.length} users by email…`}
          style={{ ...S.input, flex: 1, minWidth: 200 }} />
        <label style={{ fontSize: '0.85rem', color: 'var(--app-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={onlyAdmins} onChange={(e) => setOnlyAdmins(e.target.checked)} />
          Admins only ({adminCount})
        </label>
      </div>

      <div style={{ border: '1px solid var(--app-line)', borderRadius: 10, overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--app-faint)', margin: 0 }}>No users match.</p>
        )}
        {filtered.map((u) => {
          const isAdmin = u.isEnvAdmin || u.isDbAdmin;
          const isSelf = u.id === currentUserId;
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.85rem', borderTop: '1px solid var(--app-line)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{u.email || u.id}</strong>
                  {u.isEnvAdmin && <span style={S.badge('env')}>admin · env</span>}
                  {u.isDbAdmin && !u.isEnvAdmin && <span style={S.badge('db')}>admin</span>}
                  {isSelf && <span style={{ fontSize: '0.72rem', color: 'var(--app-faint)' }}>you</span>}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--app-faint)' }}>
                  {u.last_sign_in_at ? `last seen ${new Date(u.last_sign_in_at).toLocaleDateString()}` : 'never signed in'}
                </div>
              </div>

              {u.isEnvAdmin ? (
                <span style={{ fontSize: '0.76rem', color: 'var(--app-faint)' }}>via ADMIN_EMAILS</span>
              ) : u.isDbAdmin ? (
                <form action={revokeAction}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <button style={S.btnDanger} disabled={isSelf} title={isSelf ? "You can't revoke your own access" : undefined}>
                    Revoke admin
                  </button>
                </form>
              ) : (
                <form action={grantAction}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <input type="hidden" name="email" value={u.email || ''} />
                  <button style={S.btnPrimary}>Make admin</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
