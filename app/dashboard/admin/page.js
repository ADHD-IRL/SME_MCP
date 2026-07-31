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
        <p style={{ color: 'var(--app-danger)' }}>
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
      <p style={{ color: 'var(--app-muted)', marginTop: 4 }}>
        {pending.length} pending {pending.length === 1 ? 'proposal' : 'proposals'} for the shared library.
      </p>

      {pending.length === 0 && <p style={{ color: 'var(--app-faint)' }}>Nothing awaiting review.</p>}

      {pending.map((p) => {
        const sme = p.smes || {};
        const checks = p.auto_checks || {};
        return (
          <section key={p.id} style={{ border: '1px solid var(--app-line)', borderRadius: 10, padding: '1.1rem 1.25rem', margin: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '1.05rem' }}>{sme.name}</strong>
                <span style={{ color: 'var(--app-muted)' }}> · {sme.discipline}</span>
                <div style={{ color: 'var(--app-muted)', fontSize: '0.9rem', marginTop: 2 }}>
                  quality {sme.quality_score ?? '—'} · {sme.usage_count ?? 0} uses
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--app-faint)' }}>{new Date(p.created_at).toLocaleDateString()}</div>
            </div>

            {sme.persona_description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--app-ink)', marginTop: '0.6rem' }}>{sme.persona_description}</p>
            )}

            <details style={{ fontSize: '0.85rem', color: 'var(--app-muted)', marginTop: '0.4rem' }}>
              <summary>Automated checks</summary>
              <pre style={{ background: 'var(--app-soft)', padding: '0.6rem', borderRadius: 6, overflowX: 'auto' }}>
                {JSON.stringify(checks, null, 2)}
              </pre>
            </details>
            {p.review_notes && <p style={{ fontSize: '0.85rem', color: 'var(--app-muted)' }}>Proposer note: {p.review_notes}</p>}

            <form action={decidePromotionAction} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              <input type="hidden" name="promotion_id" value={p.id} />
              <input name="notes" placeholder="Review note (optional)" style={{ flex: 1, minWidth: 180, padding: '0.4rem', border: '1px solid var(--app-line)', borderRadius: 6 }} />
              <button name="decision" value="approved" style={approveBtn}>Approve</button>
              <button name="decision" value="rejected" style={rejectBtn}>Reject</button>
            </form>
          </section>
        );
      })}
    </main>
  );
}

const approveBtn = { padding: '0.45rem 1rem', border: 'none', borderRadius: 6, background: 'var(--app-ok)', color: 'var(--app-card)', cursor: 'pointer' };
const rejectBtn = { padding: '0.45rem 1rem', border: '1px solid var(--app-danger)', borderRadius: 6, background: 'var(--app-card)', color: 'var(--app-danger)', cursor: 'pointer' };
