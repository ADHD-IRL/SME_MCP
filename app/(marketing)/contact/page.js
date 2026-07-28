import { submitLeadAction } from './actions.js';

export const metadata = {
  title: 'Contact — SME Library',
  description: 'Questions, ideas, contributions, or help self-hosting the SME Library.',
};
export const dynamic = 'force-dynamic';

export default async function Contact({ searchParams }) {
  const params = await searchParams;
  const sent = params?.sent === '1';
  const error = params?.error;

  return (
    <>
      <section className="mk-hero" style={{ paddingBottom: 30 }}>
        <div className="mk-container">
          <span className="mk-eyebrow">Get in touch</span>
          <h1>Say hello.</h1>
          <p className="lead">
            Questions, ideas, want to contribute, or need a hand self-hosting? Drop us a line — or
            open an issue or discussion on{' '}
            <a href="https://github.com/ADHD-IRL/SME_MCP" style={{ color: 'var(--accent-ink)' }}>GitHub</a>.
          </p>
        </div>
      </section>

      <section className="mk-section" style={{ borderTop: 'none', paddingTop: 0 }}>
        <div className="mk-container" style={{ maxWidth: 560 }}>
          {sent ? (
            <div className="mk-card" style={{ textAlign: 'center', padding: '40px 28px' }}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <h3 style={{ marginTop: 12 }}>Thanks — we've got it.</h3>
              <p>We'll be in touch at the email you provided. In the meantime, you can{' '}
                <a href="/dashboard" style={{ color: 'var(--accent-ink)' }}>get started</a>.</p>
            </div>
          ) : (
            <form action={submitLeadAction} className="mk-card" style={{ display: 'grid', gap: 14, padding: 26 }}>
              {error && (
                <p style={{ background: '#fdecea', color: '#a12', padding: '0.6rem 0.9rem', borderRadius: 8, margin: 0 }}>{error}</p>
              )}
              <label style={lbl}>Name<input name="name" style={inp} autoComplete="name" /></label>
              <label style={lbl}>Email *<input name="email" type="email" required style={inp} autoComplete="email" /></label>
              <label style={lbl}>Organization (optional)<input name="company" style={inp} autoComplete="organization" /></label>
              <label style={lbl}>
                Topic
                <select name="plan_interest" style={inp} defaultValue="">
                  <option value="">Select…</option>
                  <option>General question</option>
                  <option>Contributing</option>
                  <option>Self-hosting help</option>
                  <option>Partnership / collaboration</option>
                  <option>Other</option>
                </select>
              </label>
              <label style={lbl}>Message<textarea name="message" rows={4} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} /></label>
              <button className="mk-btn mk-btn-primary" style={{ width: '100%' }}>Send</button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

const lbl = { fontSize: '0.9rem', color: 'var(--muted)', display: 'grid', gap: 5 };
const inp = { padding: '0.6rem', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg)', color: 'var(--ink)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
