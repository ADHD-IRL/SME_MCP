import { signIn, signUp } from './actions.js';

export const metadata = { title: 'Sign in — SME Library' };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const message = params?.message;

  return (
    <main style={{ maxWidth: 380, margin: '5rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <h1>SME Library</h1>
      <p style={{ color: '#555' }}>Sign in, or create an account to get an API key.</p>

      {error && (
        <p style={{ background: '#fdecea', color: '#a12', padding: '0.6rem 0.9rem', borderRadius: 6 }}>{error}</p>
      )}
      {message && (
        <p style={{ background: '#eef6ec', color: '#276', padding: '0.6rem 0.9rem', borderRadius: 6 }}>{message}</p>
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
      </form>
    </main>
  );
}

const inputStyle = {
  display: 'block', width: '100%', marginTop: 4, padding: '0.5rem',
  border: '1px solid #ccc', borderRadius: 6, fontSize: '1rem', boxSizing: 'border-box',
};
const primaryBtn = {
  flex: 1, padding: '0.55rem', border: 'none', borderRadius: 6,
  background: '#111', color: '#fff', fontSize: '1rem', cursor: 'pointer',
};
const secondaryBtn = { ...primaryBtn, background: '#fff', color: '#111', border: '1px solid #111' };
