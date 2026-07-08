import Link from 'next/link';

export const metadata = {
  title: 'Pricing — SME Library',
  description: 'Start free. Upgrade for higher limits, private experts at scale, and priority support.',
};

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    per: 'forever',
    tag: null,
    feature: false,
    cta: 'Get started',
    features: [
      'Full access to the shared library',
      'Private workspace for your own experts',
      '60 requests / minute',
      '20 AI generations / day',
      'Hybrid search, versioning, feedback',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    per: 'per month',
    tag: 'Most popular',
    feature: true,
    cta: 'Start Pro',
    features: [
      'Everything in Free',
      '300 requests / minute',
      '200 AI generations / day',
      'Propose experts to the shared library',
      'Priority generation queue',
      'Email support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    per: 'annual',
    tag: null,
    feature: false,
    cta: 'Contact sales',
    href: '/contact',
    features: [
      'Unlimited requests & generations',
      'Private / self-hosted library options',
      'SSO & OAuth for connectors',
      'Dedicated admin & curation support',
      'Custom domain expert packs',
      'SLA & security review',
    ],
  },
];

export default function Pricing() {
  return (
    <>
      <section className="mk-hero" style={{ paddingBottom: 36 }}>
        <div className="mk-container">
          <span className="mk-eyebrow">Pricing</span>
          <h1>Start free.<br />Scale when you're ready.</h1>
          <p className="lead">
            Every plan includes the shared library and a private workspace. Paid tiers raise your
            limits and unlock contributing back to the library.
          </p>
        </div>
      </section>

      <section className="mk-section" style={{ borderTop: 'none', paddingTop: 8 }}>
        <div className="mk-container">
          <div className="mk-price">
            {PLANS.map((p) => (
              <div key={p.name} className={`mk-plan${p.feature ? ' feat' : ''}`}>
                {p.tag && <span className="tag">{p.tag}</span>}
                <h3>{p.name}</h3>
                <div className="amt">{p.price}</div>
                <div className="per">{p.per}</div>
                <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <Link href={p.href || '/dashboard'} className={`mk-btn ${p.feature ? 'mk-btn-primary' : 'mk-btn-ghost'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
          <p className="sub mk-center" style={{ margin: '30px auto 0' }}>
            Limits are enforced per API key. Need something in between, or usage-based billing?{' '}
            <Link href="/contact" style={{ color: 'var(--accent-ink)' }}>Get in touch</Link>.
          </p>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container mk-center">
          <h2>Questions</h2>
        </div>
        <div className="mk-container" style={{ maxWidth: 760 }}>
          <div className="mk-grid two">
            <div className="mk-card"><h3>Is the shared library really free?</h3><p>Yes. Reading, searching, and cloning shared experts is available on every plan, including Free.</p></div>
            <div className="mk-card"><h3>Who owns experts I create?</h3><p>Your workspace experts are private to you. They only enter the shared library if you propose one and an admin approves it.</p></div>
            <div className="mk-card"><h3>What counts as a generation?</h3><p>Each AI-generated profile via <code>generate_sme</code>. Search, create, import, and clone don't count against the generation quota.</p></div>
            <div className="mk-card"><h3>Can I self-host?</h3><p>Enterprise plans can run a private deployment against their own Supabase and model keys. Talk to us.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
