'use client';

// Route-level error boundary. Replaces the bare "Application error: a
// client-side exception has occurred" white screen with a theme-aware page
// that offers a retry and a full reload. A full reload also clears the common
// post-deploy ChunkLoadError (a stale tab requesting a chunk hash that no
// longer exists), which otherwise surfaces as a generic client-side exception.
export default function Error({ error, reset }) {
  const isChunk = /ChunkLoadError|Loading chunk|dynamically imported module/i.test(
    `${error?.name} ${error?.message}`,
  );
  return (
    <main style={{ maxWidth: 560, margin: '4rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <h1 style={{ marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ color: 'var(--app-muted)', marginTop: 0 }}>
        {isChunk
          ? 'A new version was just deployed and this tab is running the old one. Reload to get the latest.'
          : 'The page hit an unexpected error. You can retry, or reload for a fresh copy.'}
      </p>
      {error?.digest && (
        <p style={{ fontSize: '0.82rem', color: 'var(--app-faint)' }}>
          Error reference: <code>{error.digest}</code>
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={() => reset()} style={btn}>Try again</button>
        <button onClick={() => window.location.reload()} style={btnPrimary}>Reload page</button>
        <a href="/dashboard" style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Back to dashboard</a>
      </div>
    </main>
  );
}

const btn = { padding: '0.5rem 1rem', border: '1px solid var(--app-line)', borderRadius: 6, background: 'var(--app-card)', color: 'var(--app-ink)', cursor: 'pointer', fontSize: '0.9rem' };
const btnPrimary = { padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: 'var(--app-accent)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 };
