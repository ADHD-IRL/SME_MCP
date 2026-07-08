import Link from 'next/link';

export const metadata = {
  title: 'SME Library — expert minds for your AI agents',
  description:
    'A curated, quality-ranked library of subject-matter expert profiles your AI agents consult over MCP. Bring proprietary expertise to any agentic workflow.',
};

export default function Home() {
  return (
    <>
      <section className="mk-hero">
        <div className="mk-container">
          <span className="mk-eyebrow">Model Context Protocol · Expert profiles</span>
          <h1>Give your AI agents<br />a bench of experts.</h1>
          <p className="lead">
            SME Library is a curated, quality-ranked catalog of subject-matter expert profiles —
            served over MCP so any agent can find the right expert, reason in their voice, and get
            sharper answers. Build your own private roster, or draw on the shared library.
          </p>
          <div className="row">
            <Link href="/dashboard" className="mk-btn mk-btn-primary">Get an API key</Link>
            <Link href="/browse" className="mk-btn mk-btn-ghost">Browse the library</Link>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container mk-center">
          <h2>What is an SME?</h2>
          <p className="sub">
            A <strong>Subject Matter Expert</strong> profile is a structured persona — a discipline,
            an expertise level, a way of reasoning, known strengths and blind spots. Agents load one
            to think like a seasoned specialist instead of a generalist, and can consult several to
            pressure-test a decision from multiple angles.
          </p>
          <div className="mk-grid">
            <div className="mk-card">
              <span className="ic">🧠</span>
              <h3>Structured expertise</h3>
              <p>Persona, background, reasoning style, cognitive biases, strengths and limitations — not a one-line system prompt.</p>
            </div>
            <div className="mk-card">
              <span className="ic">📚</span>
              <h3>A living library</h3>
              <p>Every expert is versioned and quality-scored from real session feedback, so the best rise to the top.</p>
            </div>
            <div className="mk-card">
              <span className="ic">🔌</span>
              <h3>Any MCP client</h3>
              <p>Connect Claude, an IDE, or your own agent with one command. No SDK lock-in.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <h2>What's in the library</h2>
          <p className="sub">Domain-agnostic at the core, extensible per field. A few of the areas experts can cover:</p>
          <div className="mk-pills">
            {['Site reliability', 'Security & red-teaming', 'Distributed systems', 'Product strategy',
              'Legal & compliance', 'Data science', 'Clinical & healthcare', 'Finance & risk',
              'DevOps', 'ML engineering', 'UX research', 'Growth', 'Incident response', 'Architecture'
            ].map((t) => <span key={t} className="mk-pill">{t}</span>)}
          </div>
          <p className="sub" style={{ marginTop: 22 }}>
            Each profile carries an optional <code>extensions</code> pack for domain-specific fields —
            e.g. adversary model and severity defaults for a red-team expert — so specialists stay
            specialized without bloating the core schema.
          </p>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container mk-center">
          <h2>Connect in under a minute</h2>
          <p className="sub">Point any MCP client at the server with your key.</p>
        </div>
        <div className="mk-container" style={{ maxWidth: 720 }}>
          <div className="mk-code">
            <span className="c"># Add the SME Library to Claude Code (or any MCP client)</span><br />
            <span className="k">claude</span> mcp add --transport http sme-library \<br />
            &nbsp;&nbsp;https://your-deployment/api/mcp \<br />
            &nbsp;&nbsp;--header <span className="k">"Authorization: Bearer sme_live_…"</span>
          </div>
          <div className="mk-steps" style={{ marginTop: 24 }}>
            <div className="mk-step"><h3>Find an expert</h3><p><code>search_smes</code> across the library and your workspace with hybrid keyword + semantic ranking.</p></div>
            <div className="mk-step"><h3>Consult</h3><p>Load the profile into your agent's context and reason in that expert's voice.</p></div>
            <div className="mk-step"><h3>Improve</h3><p><code>record_feedback</code> after a session; quality scores update and the best experts surface.</p></div>
          </div>
        </div>
      </section>

      <section className="mk-cta">
        <div className="mk-container">
          <div className="box">
            <h2>Bring proprietary expertise to your agents</h2>
            <p>Create a private roster of experts, keep it in your own workspace, and promote your best to the shared library when you're ready.</p>
            <Link href="/dashboard" className="mk-btn mk-btn-primary">Start free</Link>
          </div>
        </div>
      </section>
    </>
  );
}
