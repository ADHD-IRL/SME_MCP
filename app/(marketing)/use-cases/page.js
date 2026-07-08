import Link from 'next/link';

export const metadata = {
  title: 'Use cases — SME Library',
  description:
    'Where a library of expert personas pays off: multi-agent debate, code review, red-teaming, advisory panels, and domain-specialized assistants.',
};

const CASES = [
  ['⚖️', 'Multi-agent debate', 'Convene a panel of experts with genuinely different priorities and biases, let them argue a decision, and surface the disagreement a single model would smooth over.'],
  ['🔍', 'Code & design review', 'Load a senior reviewer in the relevant discipline. Get review that reflects how a distributed-systems principal or a security lead actually thinks — not generic lint.'],
  ['🛡️', 'Red-teaming & risk', 'Point an adversarial expert at a plan. Their extensions pack encodes an adversary model and severity defaults, so the critique is structured, not hand-wavy.'],
  ['🧭', 'Advisory panels', 'Give a product or strategy agent a bench to consult — finance, legal, growth, ops — and weigh trade-offs from each seat before committing.'],
  ['🩺', 'Domain assistants', 'Ground a vertical assistant (clinical, legal, financial) in an expert persona with the right evidence standards and communication style for the field.'],
  ['🏢', 'Your proprietary expertise', 'Encode your firm\'s hard-won specialists as private SMEs. Reuse them across every agent and workflow, version them, and keep them in your workspace.'],
];

export default function UseCases() {
  return (
    <>
      <section className="mk-hero" style={{ paddingBottom: 36 }}>
        <div className="mk-container">
          <span className="mk-eyebrow">Use cases</span>
          <h1>One library,<br />many sharper agents.</h1>
          <p className="lead">
            Anywhere an agent would benefit from a specific expert's judgment — instead of a
            generalist's average — the SME Library earns its place.
          </p>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <div className="mk-grid">
            {CASES.map(([ic, h, p]) => (
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
        <div className="mk-container mk-center">
          <h2>Why a shared, ranked library</h2>
          <p className="sub">
            Anyone can write a system prompt. The value compounds when experts are reusable,
            comparable, and quality-ranked — so your agents reach for the profile that has actually
            performed, and the library gets better every time it's used.
          </p>
          <div className="mk-grid">
            <div className="mk-card"><h3>Reusable</h3><p>Author once, consult from every agent and workflow. No copy-pasted prompts drifting out of sync.</p></div>
            <div className="mk-card"><h3>Comparable</h3><p>A shared core schema means experts can be searched, ranked, and swapped like interchangeable parts.</p></div>
            <div className="mk-card"><h3>Accountable</h3><p>Feedback and versioning make quality measurable and changes reversible — expertise you can govern.</p></div>
          </div>
        </div>
      </section>

      <section className="mk-cta">
        <div className="mk-container">
          <div className="box">
            <h2>Put an expert on the problem</h2>
            <p>Browse the shared library or stand up your own private roster today.</p>
            <Link href="/dashboard" className="mk-btn mk-btn-primary">Get started</Link>
          </div>
        </div>
      </section>
    </>
  );
}
