import { signIn, signUp, resendConfirmation } from './actions.js';

export const metadata = { title: 'Sign in — SME Library' };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const message = params?.message;

  return (
    <main style={{ maxWidth: 380, margin: '5rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <h1>SME Library</h1>
      <p style={{ color: 'var(--app-muted)' }}>Sign in, or create an account to get an API key.</p>

      {error && (
        <p style={{ background: 'var(--app-danger-bg)', color: 'var(--app-danger)', padding: '0.6rem 0.9rem', borderRadius: 6 }}>{error}</p>
      )}
      {message && (
        <p style={{ background: 'var(--app-ok-bg)', color: 'var(--app-ok)', padding: '0.6rem 0.9rem', borderRadius: 6 }}>{message}</p>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" style={inputStyle} />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} autoComplete="current-password" style={inputStyle} />
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button formAction={signIn} style={primaryBtn}>Sign in</button>
          <button formAction={signUp} style={secondaryBtn}>Create account</button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--app-muted)', margin: '0.25rem 0 0' }}>
          Didn’t get the confirmation email?{' '}
          <button formAction={resendConfirmation} style={linkBtn}>Resend it</button>
        </p>
      </form>
    </main>
  );
}

const inputStyle = {
  display: 'block', width: '100%', marginTop: 4, padding: '0.5rem',
  border: '1px solid var(--app-line)', borderRadius: 6, fontSize: '1rem', boxSizing: 'border-box',
};
const primaryBtn = {
  flex: 1, padding: '0.55rem', border: 'none', borderRadius: 6,
  background: 'var(--app-ink)', color: 'var(--app-card)', fontSize: '1rem', cursor: 'pointer',
};
const secondaryBtn = { ...primaryBtn, background: 'var(--app-card)', color: 'var(--app-ink)', border: '1px solid var(--app-ink)' };
const linkBtn = { background: 'none', border: 'none', color: 'var(--app-accent-ink)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' };
