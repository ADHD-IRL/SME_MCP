import { redirect } from 'next/navigation';
import { getCurrentUser, isAdminEmail } from '../../../../src/lib/supabase-ssr.js';
import { listLibrarySmes } from '../../../../src/lib/admin-library.js';
import { setStatusAction, deleteLibraryAction } from './actions.js';

export const metadata = { title: 'Library management — SME Library' };
export const dynamic = 'force-dynamic';

export default async function LibraryAdmin({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) {
    return (
      <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem' }}>
        <h1>Library management</h1>
        <p style={{ color: '#a12' }}>Admin access required.</p>
        <p><a href="/dashboard">← Back to dashboard</a></p>
      </main>
    );
  }

  const params = await searchParams;
  const status = params?.status || 'all';
  const query = params?.q || '';

  let smes = [];
  let loadError = null;
  try {
    smes = await listLibrarySmes({ status, query });
  } catch (err) {
    loadError = err.message;
  }

  const tabs = ['all', 'active', 'deprecated', 'archived'];

  return (
    <main style={{ maxWidth: 900, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ marginBottom: 0 }}>Library management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/dashboard/admin">Promotion queue</a>
          <a href="/dashboard">Dashboard</a>
        </div>
      </div>
      <p style={{ color: '#555', marginTop: 4 }}>{smes.length} SME{smes.length === 1 ? '' : 's'} in the shared library.</p>

      <form style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input name="q" defaultValue={query} placeholder="Search the library…" style={{ flex: 1, padding: '0.45rem', border: '1px solid #ccc', borderRadius: 6 }} />
        <input type="hidden" name="status" value={status} />
        <button style={btn}>Search</button>
      </form>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {tabs.map((t) => (
          <a key={t} href={`/dashboard/admin/library?status=${t}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
             style={{ padding: '0.25rem 0.7rem', borderRadius: 999, textDecoration: 'none',
                      background: t === status ? '#111' : '#eee', color: t === status ? '#fff' : '#333', fontSize: '0.85rem' }}>
            {t}
          </a>
        ))}
      </div>

      {loadError && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.8rem 1rem', margin: '1rem 0', fontSize: '0.9rem' }}>
          <strong>Couldn't load the library.</strong> Apply the pending database migration
          (<code>supabase db push</code>) — the schema is missing new columns. Details: <code>{loadError}</code>
        </div>
      )}
      {!loadError && smes.length === 0 && <p style={{ color: '#888' }}>No matching library SMEs.</p>}

      {smes.map((s) => (
        <section key={s.id} style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '1rem 1.15rem', margin: '0.8rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline' }}>
            <div>
              <strong>{s.name}</strong> <span style={{ color: '#666' }}>· {s.discipline}</span>
              <span style={statusPill(s.status)}>{s.status}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>quality {s.quality_score ?? '—'} · {s.usage_count ?? 0} uses</span>
          </div>
          {s.persona_description && <p style={{ fontSize: '0.9rem', color: '#333', margin: '0.5rem 0' }}>{s.persona_description}</p>}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem', alignItems: 'center' }}>
            <a href={`/dashboard/admin/library/${s.id}`} style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}>Edit</a>

            {s.status !== 'active' && (
              <StatusButton id={s.id} status="active" label="Activate" />
            )}
            {s.status !== 'deprecated' && (
              <StatusButton id={s.id} status="deprecated" label="Deprecate" />
            )}
            {s.status !== 'archived' && (
              <StatusButton id={s.id} status="archived" label="Archive" />
            )}

            <form action={deleteLibraryAction} style={{ marginLeft: 'auto' }}>
              <input type="hidden" name="id" value={s.id} />
              <button style={dangerBtn}>Delete permanently</button>
            </form>
          </div>
        </section>
      ))}
    </main>
  );
}

function StatusButton({ id, status, label }) {
  return (
    <form action={setStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button style={btn}>{label}</button>
    </form>
  );
}

const btn = { padding: '0.4rem 0.85rem', border: '1px solid #111', borderRadius: 6, background: '#fff', color: '#111', cursor: 'pointer', fontSize: '0.85rem' };
const dangerBtn = { ...btn, border: '1px solid #a12', color: '#a12' };
function statusPill(status) {
  const map = { active: ['#e6f4ea', '#1a7f37'], deprecated: ['#fff4e5', '#b26a00'], archived: ['#eee', '#666'] };
  const [bg, fg] = map[status] || ['#eee', '#666'];
  return { marginLeft: 8, fontSize: '0.72rem', fontWeight: 600, padding: '1px 8px', borderRadius: 10, background: bg, color: fg, verticalAlign: 'middle' };
}
