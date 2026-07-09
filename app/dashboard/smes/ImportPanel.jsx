'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { looksLikeMarkdown, parseSmeMarkdown } from '../../../src/lib/sme-schema.js';

const BATCH = 8;

// Parse the payload in the browser (pure functions only — no server round-trip
// just to count), matching the server's parseImportPayload behavior.
function parsePayload(text) {
  if (looksLikeMarkdown(text)) return parseSmeMarkdown(text);
  const json = JSON.parse(text);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.smes)) return json.smes;
  return [json];
}

function fmtDuration(sec) {
  if (!isFinite(sec) || sec < 0) return '—';
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function ImportPanel({ admin }) {
  const router = useRouter();
  const [status, setStatus] = useState('idle'); // idle | importing | done | error
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [succeeded, setSucceeded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [eta, setEta] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const toLibrary = form.to_library?.checked || false;

    let text = (form.json.value || '').trim();
    const file = form.file.files?.[0];
    if (!text && file) text = (await file.text()).trim();

    if (!text) { setStatus('error'); setMessage('Paste the profiles or choose a file to import.'); return; }

    let items;
    try {
      items = parsePayload(text);
    } catch (err) {
      setStatus('error'); setMessage(`Couldn't parse: ${err.message}`); return;
    }
    if (!items.length) { setStatus('error'); setMessage('No SME profiles found in the payload.'); return; }
    if (items.length > 500) { setStatus('error'); setMessage(`Found ${items.length} profiles — the limit is 500 per import.`); return; }

    // Reset counters and start.
    setStatus('importing');
    setMessage('');
    setTotal(items.length);
    setProcessed(0); setSucceeded(0); setFailed(0); setErrors([]);
    setEta(null);

    const start = Date.now();
    let done = 0, ok = 0, bad = 0;
    const allErrors = [];

    for (let i = 0; i < items.length; i += BATCH) {
      const slice = items.slice(i, i + BATCH);
      try {
        const res = await fetch('/api/import/batch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ items: slice, toLibrary }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const r = await res.json();
        ok += r.succeeded || 0;
        bad += r.failed || 0;
        if (r.errors?.length) allErrors.push(...r.errors);
      } catch (err) {
        // Count the whole slice as failed but keep going.
        bad += slice.length;
        allErrors.push({ name: null, error: `Batch failed: ${err.message}` });
      }

      done += slice.length;
      setProcessed(done); setSucceeded(ok); setFailed(bad); setErrors(allErrors);

      const elapsed = (Date.now() - start) / 1000;
      const rate = elapsed / done; // seconds per SME so far
      setEta(rate * (items.length - done));
    }

    setStatus('done');
    setMessage(`Imported ${ok} of ${items.length}${bad ? `, ${bad} failed` : ''}${toLibrary ? ' into the library' : ''}.`);
    router.refresh(); // refresh the server-rendered list below
  }

  const pct = total ? Math.round((processed / total) * 100) : 0;
  const busy = status === 'importing';

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.7rem' }}>
      <textarea
        name="json" rows={8} disabled={busy}
        placeholder={'Paste the Markdown profile format (## Name / **Field:** …), or JSON.'}
        style={{ ...area, fontFamily: 'monospace', fontSize: '0.82rem' }}
      />
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" name="file" accept="application/json,.json,.md,text/markdown" disabled={busy} />
        {admin && (
          <label style={{ fontSize: '0.85rem', color: '#555' }}>
            <input type="checkbox" name="to_library" disabled={busy} /> Import into the shared library (admin)
          </label>
        )}
      </div>

      <div>
        <button type="submit" style={{ ...primary, opacity: busy ? 0.6 : 1 }} disabled={busy}>
          {busy ? 'Importing…' : 'Import'}
        </button>
      </div>

      {status === 'error' && (
        <p style={{ background: '#fdecea', color: '#a12', padding: '0.6rem 0.9rem', borderRadius: 8, margin: 0, fontSize: '0.9rem' }}>{message}</p>
      )}

      {(busy || status === 'done') && total > 0 && (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 6 }}>
            <span>
              {busy
                ? `Importing ${processed} of ${total}…`
                : message}
            </span>
            <span style={{ color: '#666' }}>
              {busy ? `~${fmtDuration(eta)} left` : `${pct}%`}
            </span>
          </div>
          <div style={{ height: 10, background: '#eee', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: status === 'done' ? '#1a7f37' : '#4f46e5', transition: 'width .3s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', marginTop: 8, fontSize: '0.82rem', color: '#555' }}>
            <span>✓ {succeeded} imported</span>
            {failed > 0 && <span style={{ color: '#a12' }}>✕ {failed} failed</span>}
          </div>

          {status === 'done' && errors.length > 0 && (
            <details style={{ marginTop: 8, fontSize: '0.82rem' }}>
              <summary style={{ cursor: 'pointer', color: '#a12' }}>{errors.length} error{errors.length === 1 ? '' : 's'}</summary>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#555' }}>
                {errors.slice(0, 20).map((e, i) => (
                  <li key={i}>{e.name ? `${e.name}: ` : ''}{e.error}</li>
                ))}
                {errors.length > 20 && <li>…and {errors.length - 20} more</li>}
              </ul>
            </details>
          )}
        </div>
      )}
    </form>
  );
}

const area = { display: 'block', width: '100%', marginTop: 3, padding: '0.5rem', border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box', resize: 'vertical' };
const primary = { padding: '0.55rem 1.2rem', border: 'none', borderRadius: 6, background: '#111', color: '#fff', cursor: 'pointer' };
