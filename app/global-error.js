'use client';

// Top-level boundary for errors thrown in the root layout itself. Must render
// its own <html>/<body> because it replaces the root layout when it fires.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', margin: 0, background: '#0b1120', color: '#e5e7eb' }}>
        <main style={{ maxWidth: 560, margin: '4rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#93a4bd' }}>
            The application hit an unexpected error. Reload to get a fresh copy.
          </p>
          {error?.digest && (
            <p style={{ fontSize: '0.82rem', color: '#7688a0' }}>
              Error reference: <code>{error.digest}</code>
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => reset()} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #26344b', background: '#111a2e', color: '#e5e7eb', cursor: 'pointer' }}>Try again</button>
            <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: '#818cf8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Reload page</button>
          </div>
        </main>
      </body>
    </html>
  );
}
