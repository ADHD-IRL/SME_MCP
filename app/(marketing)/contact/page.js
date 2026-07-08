import { submitLeadAction } from './actions.js';

export const metadata = {
  title: 'Contact — SME Library',
  description: 'Talk to us about Enterprise plans, private deployments, or custom expert packs.',
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
          <span className="mk-eyebrow">Contact</span>
          <h1>Let's talk.</h1>
          <p className="lead">
            Enterprise plans, private or self-hosted deployments, custom domain expert packs, or
            just questions — tell us what you need.
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
                <a href="/dashboard" style={{ color: 'var(--accent-ink)' }}>start free</a>.</p>
            </div>
          ) : (
            <form action={submitLeadAction} className="mk-card" style={{ display: 'grid', gap: 14, padding: 26 }}>
              {error && (
                <p style={{ background: '#fdecea', color: '#a12', padding: '0.6rem 0.9rem', borderRadius: 8, margin: 0 }}>{error}</p>
              )}
              <label style={lbl}>Name<input name="name" style={inp} autoComplete="name" /></label>
              <label style={lbl}>Work email *<input name="email" type="email" required style={inp} autoComplete="email" /></label>
              <label style={lbl}>Company<input name="company" style={inp} autoComplete="organization" /></label>
              <label style={lbl}>
                Plan of interest
                <select name="plan_interest" style={inp} defaultValue="">
                  <option value="">Select…</option>
                  <option>Free</option>
                  <option>Pro</option>
                  <option>Enterprise</option>
                  <option>Not sure yet</option>
                </select>
              </label>
              <label style={lbl}>How can we help?<textarea name="message" rows={4} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} /></label>
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
