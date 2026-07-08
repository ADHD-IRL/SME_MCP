import { redirect } from 'next/navigation';
import { getCurrentUser, isAdminEmail } from '../../../src/lib/supabase-ssr.js';
import { listPendingPromotions } from '../../../src/lib/promotions.js';
import { decidePromotionAction } from './actions.js';

export const metadata = { title: 'Promotion queue — SME Library' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdminEmail(user.email)) {
    return (
      <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem' }}>
        <h1>Promotion queue</h1>
        <p style={{ color: '#a12' }}>
          Admin access required. Ask an operator to add <code>{user.email}</code> to
          the <code>ADMIN_EMAILS</code> setting.
        </p>
        <p><a href="/dashboard">← Back to dashboard</a></p>
      </main>
    );
  }

  const pending = await listPendingPromotions();

  return (
    <main style={{ maxWidth: 820, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ marginBottom: 0 }}>Promotion queue</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/dashboard/admin/library">Library management</a>
          <a href="/dashboard">Dashboard</a>
        </div>
      </div>
      <p style={{ color: '#555', marginTop: 4 }}>
        {pending.length} pending {pending.length === 1 ? 'proposal' : 'proposals'} for the shared library.
      </p>

      {pending.length === 0 && <p style={{ color: '#888' }}>Nothing awaiting review.</p>}

      {pending.map((p) => {
        const sme = p.smes || {};
        const checks = p.auto_checks || {};
        return (
          <section key={p.id} style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '1.1rem 1.25rem', margin: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '1.05rem' }}>{sme.name}</strong>
                <span style={{ color: '#666' }}> · {sme.discipline}</span>
                <div style={{ color: '#555', fontSize: '0.9rem', marginTop: 2 }}>
                  quality {sme.quality_score ?? '—'} · {sme.usage_count ?? 0} uses
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#999' }}>{new Date(p.created_at).toLocaleDateString()}</div>
            </div>

            {sme.persona_description && (
              <p style={{ fontSize: '0.9rem', color: '#333', marginTop: '0.6rem' }}>{sme.persona_description}</p>
            )}

            <details style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.4rem' }}>
              <summary>Automated checks</summary>
              <pre style={{ background: '#f6f6f6', padding: '0.6rem', borderRadius: 6, overflowX: 'auto' }}>
                {JSON.stringify(checks, null, 2)}
              </pre>
            </details>
            {p.review_notes && <p style={{ fontSize: '0.85rem', color: '#555' }}>Proposer note: {p.review_notes}</p>}

            <form action={decidePromotionAction} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              <input type="hidden" name="promotion_id" value={p.id} />
              <input name="notes" placeholder="Review note (optional)" style={{ flex: 1, minWidth: 180, padding: '0.4rem', border: '1px solid #ccc', borderRadius: 6 }} />
              <button name="decision" value="approved" style={approveBtn}>Approve</button>
              <button name="decision" value="rejected" style={rejectBtn}>Reject</button>
            </form>
          </section>
        );
      })}
    </main>
  );
}

const approveBtn = { padding: '0.45rem 1rem', border: 'none', borderRadius: 6, background: '#1a7f37', color: '#fff', cursor: 'pointer' };
const rejectBtn = { padding: '0.45rem 1rem', border: '1px solid #a12', borderRadius: 6, background: '#fff', color: '#a12', cursor: 'pointer' };
