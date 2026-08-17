'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Admin tool: build out every SME field across the library by driving the
// batched /api/admin/enrich endpoint from the browser, with a progress bar.
export default function EnrichPanel() {
  const router = useRouter();
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [message, setMessage] = useState('');

  async function run() {
    if (!confirm('Fill in every empty field on all library SMEs? This is safe to re-run and won’t create duplicates.')) return;
    setStatus('running'); setMessage(''); setProcessed(0); setUpdated(0); setTotal(0);

    let offset = 0; let done = 0; let upd = 0; let tot = 0;
    try {
      for (let guard = 0; guard < 1000; guard += 1) {
        const res = await fetch('/api/admin/enrich', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ offset, limit: 25 }),
        });
        const r = await res.json();
        if (!res.ok) throw new Error(r.error || `HTTP ${res.status}`);
        tot = r.total; done += r.processed; upd += r.updated; offset = r.nextOffset;
        setTotal(tot); setProcessed(done); setUpdated(upd);
        if (r.done) break;
      }
      setStatus('done');
      setMessage(`Built out ${upd} of ${tot} SMEs.`);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  const pct = total ? Math.round((processed / total) * 100) : 0;
  const busy = status === 'running';

  return (
    <section style={{ border: '1px solid var(--app-line)', borderRadius: 10, padding: '0.9rem 1.1rem', margin: '0 0 18px', background: 'var(--app-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <strong style={{ fontSize: '0.98rem' }}>Build out all SME fields</strong>
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--app-muted)' }}>
            Fills every empty attribute + core field across the library with realistic, varied values. Safe to re-run.
          </p>
        </div>
        <button onClick={run} disabled={busy}
          style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: 'var(--app-accent)', color: '#fff', fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, whiteSpace: 'nowrap' }}>
          {busy ? 'Building…' : 'Build out fields'}
        </button>
      </div>

      {(busy || status === 'done') && total > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: 'var(--app-muted)', marginBottom: 5 }}>
            <span>{busy ? `Processing ${processed} of ${total}…` : message}</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 9, background: 'var(--app-line)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: status === 'done' ? 'var(--app-ok)' : 'var(--app-accent)', transition: 'width .25s ease' }} />
          </div>
        </div>
      )}
      {status === 'error' && (
        <p style={{ marginTop: 10, background: 'var(--app-danger-bg)', color: 'var(--app-danger)', padding: '0.55rem 0.8rem', borderRadius: 8, fontSize: '0.86rem' }}>{message}</p>
      )}
    </section>
  );
}
