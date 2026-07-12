import Link from 'next/link';

export const metadata = {
  title: 'Product — SME Library',
  description:
    'What the SME Library MCP contains and does: a versioned, quality-ranked expert catalog with hybrid search, workspaces, a moderated shared library, and generation.',
};

const CAPS = [
  ['🔎', 'Hybrid search', 'Find experts by capability, tags, and expertise level. Keyword full-text and semantic vector search are fused so "kubernetes failure modes" and "container reliability" both land the right SME.'],
  ['🗂️', 'Private workspaces', 'Every account gets an isolated workspace. Author experts that only your agents see, with per-key scopes and rate limits.'],
  ['🏛️', 'Shared library', 'A curated public catalog of vetted experts. Clone any into your workspace, or propose your own for promotion.'],
  ['🧬', 'Versioned & auditable', 'Every edit snapshots a full version — roll back, diff, and trust what changed. All writes are logged.'],
  ['⭐', 'Quality scoring', 'Session feedback rolls into a Bayesian-smoothed quality score, so a lucky one-off never outranks a consistently strong expert.'],
  ['✨', 'AI generation', 'Need an expert that doesn\'t exist yet? Generate one from a description — with dedup that returns an existing match first to avoid clutter.'],
];

const TOOLS = [
  ['search_smes', 'Hybrid / keyword / semantic search across library + workspace'],
  ['list_smes', 'Browse experts by scope and status'],
  ['get_sme', 'Fetch a full expert profile'],
  ['create_sme', 'Author a new expert (versioned from v1)'],
  ['import_smes', 'Bulk-import up to 200 profiles'],
  ['export_smes', 'Export your workspace as import-ready JSON'],
  ['update_sme', 'Edit an expert; snapshots version history'],
  ['clone_sme', 'Copy a library expert into your workspace'],
  ['generate_sme', 'AI-generate a profile with dedup-before-create'],
  ['record_feedback', 'Score an expert\'s session performance'],
  ['propose_promotion', 'Nominate a workspace expert for the library'],
  ['review_promotion', 'Admin: approve/reject library promotions'],
  ['archive_sme', 'Soft-delete (reversible)'],
];

export default function Product() {
  return (
    <>
      <section className="mk-hero" style={{ paddingBottom: 40 }}>
        <div className="mk-container">
          <span className="mk-eyebrow">Product</span>
          <h1>A catalog of expertise,<br />built for agents.</h1>
          <p className="lead">
            The SME Library is more than a prompt store. It's a versioned, quality-ranked system of
            record for expert personas — with the search, governance, and lifecycle tooling to run
            it as a real product.
          </p>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <h2>Built for multidisciplinary risk &amp; futures</h2>
          <p className="sub">
            The library isn't a prompt store — it's analytic infrastructure. Its structure exists so
            that risk, warning, and futures efforts can assemble the right minds, hold them in
            productive tension, and trust the result.
          </p>
          <div className="mk-grid">
            <div className="mk-card">
              <span className="ic">🧩</span>
              <h3>Cover the seams</h3>
              <p>Assemble specialists across intelligence, cyber, infrastructure, legal, and human factors on one question — so the cross-discipline gaps where threats hide get covered.</p>
            </div>
            <div className="mk-card">
              <span className="ic">⚔️</span>
              <h3>Engineer disagreement</h3>
              <p>Explicit bias models, adversary lenses, and evidence standards let you put experts in tension and surface the dissent a single answer would average away.</p>
            </div>
            <div className="mk-card">
              <span className="ic">⚖️</span>
              <h3>Assessments, not opinions</h3>
              <p>Each expert declares what it over- and under-weights, when it updates, and where it defers — a defensible analytic process with known blind spots.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <h2>Capabilities</h2>
          <p className="sub">Everything you need to build, find, and maintain a library of experts.</p>
          <div className="mk-grid">
            {CAPS.map(([ic, h, p]) => (
              <div className="mk-card" key={h}>
                <span className="ic">{ic}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <h2>Inside an expert profile</h2>
          <p className="sub">A domain-agnostic core keeps every expert comparable and searchable; the extensions pack carries field-specific detail.</p>
          <div className="mk-grid two">
            <div className="mk-card">
              <h3>Core profile</h3>
              <p style={{ marginTop: 10 }}>
                Name · discipline · expertise level · persona · professional background ·
                reasoning style · cognitive biases · strengths · limitations ·
                communication style · domain knowledge · tags.
              </p>
            </div>
            <div className="mk-card">
              <h3>Extensions</h3>
              <p style={{ marginTop: 10 }}>
                A namespaced JSON pack for domain-specific fields — an adversary model and severity
                defaults for a red-team expert, evidence standards for a clinical one — without
                changing the shared schema.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <h2>How the library stays good</h2>
          <div className="mk-steps">
            <div className="mk-step"><h3>Propose</h3><p>Promote a proven workspace expert. Automated gates check usage, quality, and duplication before it enters the queue.</p></div>
            <div className="mk-step"><h3>Review</h3><p>An admin approves or rejects. Approved experts become immutable library entries with lineage back to the source.</p></div>
            <div className="mk-step"><h3>Curate</h3><p>Admins browse, edit, deprecate, or archive library entries; quality scores keep ranking honest over time.</p></div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <h2>The toolset</h2>
          <p className="sub">Thirteen MCP tools cover the full lifecycle — discover, author, import/export, curate, and govern.</p>
          <div className="mk-grid two">
            {TOOLS.map(([name, desc]) => (
              <div className="mk-card" key={name} style={{ padding: '16px 18px' }}>
                <h3 style={{ fontFamily: 'monospace', fontSize: '0.98rem' }}>{name}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-cta">
        <div className="mk-container">
          <div className="box">
            <h2>Try it with your own agent</h2>
            <p>Create a key, connect over MCP, and put an expert to work in minutes.</p>
            <Link href="/dashboard" className="mk-btn mk-btn-primary">Get started</Link>
          </div>
        </div>
      </section>
    </>
  );
}
