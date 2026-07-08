import Link from 'next/link';

// Self-contained marketing shell: one embedded stylesheet (responsive +
// light/dark), a nav, and a footer. Scoped to the (marketing) route group so
// none of this touches the authenticated dashboard.

const CSS = `
.mk { --ink:#0f172a; --muted:#475569; --line:#e2e8f0; --bg:#ffffff; --soft:#f8fafc;
  --accent:#4f46e5; --accent-ink:#4338ca; --card:#ffffff;
  color:var(--ink); background:var(--bg);
  font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.6; }
@media (prefers-color-scheme: dark) {
  .mk { --ink:#e5e7eb; --muted:#94a3b8; --line:#1e293b; --bg:#0b1120; --soft:#0f172a;
    --accent:#818cf8; --accent-ink:#a5b4fc; --card:#0f172a; }
}
.mk * { box-sizing:border-box; }
.mk a { color:inherit; text-decoration:none; }
.mk-container { max-width:1080px; margin:0 auto; padding:0 24px; }

.mk-nav { position:sticky; top:0; z-index:20; backdrop-filter:blur(8px);
  background:color-mix(in srgb, var(--bg) 82%, transparent); border-bottom:1px solid var(--line); }
.mk-nav-inner { display:flex; align-items:center; justify-content:space-between; height:62px; }
.mk-brand { font-weight:700; letter-spacing:-0.02em; font-size:1.05rem; display:flex; gap:8px; align-items:center; }
.mk-brand .dot { width:10px; height:10px; border-radius:3px; background:var(--accent); display:inline-block; }
.mk-nav-links { display:flex; gap:22px; align-items:center; }
.mk-nav-links a { color:var(--muted); font-size:0.93rem; }
.mk-nav-links a:hover { color:var(--ink); }
.mk-nav-links .cta { color:#fff; }
@media (max-width:640px){ .mk-nav-links .hide-sm{ display:none; } }

.mk-btn { display:inline-block; padding:11px 20px; border-radius:9px; font-weight:600; font-size:0.95rem;
  border:1px solid transparent; cursor:pointer; transition:transform .08s ease, box-shadow .2s ease; }
.mk-btn:hover { transform:translateY(-1px); }
.mk-btn-primary { background:var(--accent); color:#fff; box-shadow:0 6px 20px -8px var(--accent); }
.mk-btn-ghost { background:transparent; color:var(--ink); border-color:var(--line); }

.mk-hero { padding:84px 0 64px; text-align:center; }
.mk-eyebrow { display:inline-block; font-size:0.78rem; font-weight:600; letter-spacing:0.08em;
  text-transform:uppercase; color:var(--accent-ink); background:color-mix(in srgb, var(--accent) 12%, transparent);
  padding:5px 12px; border-radius:999px; margin-bottom:20px; }
.mk-hero h1 { font-size:clamp(2.1rem, 5vw, 3.4rem); line-height:1.08; letter-spacing:-0.03em; margin:0 0 18px; }
.mk-hero p.lead { font-size:clamp(1.05rem,2.2vw,1.28rem); color:var(--muted); max-width:640px; margin:0 auto 30px; }
.mk-hero .row { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

.mk-section { padding:56px 0; border-top:1px solid var(--line); }
.mk-section h2 { font-size:clamp(1.5rem,3.2vw,2rem); letter-spacing:-0.02em; margin:0 0 10px; }
.mk-section .sub { color:var(--muted); max-width:620px; margin:0 0 34px; }
.mk-center { text-align:center; }
.mk-center .sub { margin-left:auto; margin-right:auto; }

.mk-grid { display:grid; gap:20px; grid-template-columns:repeat(3,1fr); }
.mk-grid.two { grid-template-columns:repeat(2,1fr); }
@media (max-width:860px){ .mk-grid, .mk-grid.two { grid-template-columns:1fr; } }
.mk-card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:22px 22px 24px; }
.mk-card h3 { margin:0 0 8px; font-size:1.08rem; letter-spacing:-0.01em; }
.mk-card p { margin:0; color:var(--muted); font-size:0.95rem; }
.mk-card .ic { font-size:1.5rem; margin-bottom:10px; display:block; }

.mk-steps { counter-reset:step; display:grid; gap:18px; grid-template-columns:repeat(3,1fr); }
@media (max-width:860px){ .mk-steps { grid-template-columns:1fr; } }
.mk-step { position:relative; padding:22px; border:1px solid var(--line); border-radius:14px; background:var(--soft); }
.mk-step::before { counter-increment:step; content:counter(step); display:flex; align-items:center; justify-content:center;
  width:30px; height:30px; border-radius:8px; background:var(--accent); color:#fff; font-weight:700; margin-bottom:12px; }
.mk-step h3 { margin:0 0 6px; font-size:1.02rem; }
.mk-step p { margin:0; color:var(--muted); font-size:0.93rem; }

.mk-code { background:#0b1120; color:#e2e8f0; border:1px solid #1e293b; border-radius:12px;
  padding:18px 20px; overflow-x:auto; font-family:"SF Mono",Consolas,monospace; font-size:0.85rem; line-height:1.7; }
.mk-code .c { color:#64748b; }
.mk-code .k { color:#a5b4fc; }

.mk-cta { text-align:center; padding:72px 0; }
.mk-cta .box { background:linear-gradient(135deg, var(--accent), var(--accent-ink)); border-radius:20px;
  padding:52px 28px; color:#fff; }
.mk-cta h2 { color:#fff; margin:0 0 12px; }
.mk-cta p { color:rgba(255,255,255,0.9); max-width:520px; margin:0 auto 26px; }
.mk-cta .mk-btn-primary { background:#fff; color:var(--accent-ink); box-shadow:none; }

.mk-footer { border-top:1px solid var(--line); padding:34px 0; color:var(--muted); font-size:0.9rem; }
.mk-footer .fx { display:flex; justify-content:space-between; flex-wrap:wrap; gap:16px; }
.mk-footer a { color:var(--muted); }
.mk-footer a:hover { color:var(--ink); }

.mk-pills { display:flex; flex-wrap:wrap; gap:8px; }
.mk-pill { border:1px solid var(--line); border-radius:999px; padding:5px 13px; font-size:0.85rem; color:var(--muted); background:var(--soft); }

.mk-price { display:grid; gap:20px; grid-template-columns:repeat(3,1fr); align-items:start; }
@media (max-width:860px){ .mk-price { grid-template-columns:1fr; } }
.mk-plan { border:1px solid var(--line); border-radius:16px; padding:26px; background:var(--card); }
.mk-plan.feat { border-color:var(--accent); box-shadow:0 12px 40px -18px var(--accent); position:relative; }
.mk-plan.feat .tag { position:absolute; top:-11px; left:26px; background:var(--accent); color:#fff;
  font-size:0.72rem; font-weight:700; padding:3px 10px; border-radius:999px; letter-spacing:0.04em; }
.mk-plan h3 { margin:0 0 4px; font-size:1.2rem; }
.mk-plan .amt { font-size:2rem; font-weight:700; letter-spacing:-0.02em; margin:8px 0 2px; }
.mk-plan .per { color:var(--muted); font-size:0.9rem; }
.mk-plan ul { list-style:none; padding:0; margin:18px 0 22px; }
.mk-plan li { padding:6px 0 6px 24px; position:relative; font-size:0.93rem; color:var(--muted); }
.mk-plan li::before { content:"✓"; position:absolute; left:0; color:var(--accent); font-weight:700; }
.mk-plan .mk-btn { width:100%; text-align:center; }
`;

function Nav() {
  return (
    <nav className="mk-nav">
      <div className="mk-container mk-nav-inner">
        <Link href="/" className="mk-brand"><span className="dot" />SME Library</Link>
        <div className="mk-nav-links">
          <Link href="/product" className="hide-sm">Product</Link>
          <Link href="/use-cases" className="hide-sm">Use cases</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard" className="mk-btn mk-btn-primary cta">Get started</Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mk-footer">
      <div className="mk-container fx">
        <div><strong style={{ color: 'var(--ink)' }}>SME Library</strong> — a curated MCP of subject-matter experts.</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link href="/product">Product</Link>
          <Link href="/use-cases">Use cases</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
          <a href="/api/library">Public library API</a>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }) {
  return (
    <div className="mk">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
