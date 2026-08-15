import Link from 'next/link';
import { ATTRIBUTE_GROUPS } from '../../../src/lib/sme-schema.js';
import {
  VALUE_SCALES, CORE_FIELD_DOCS, ATTR_FIELD_DOCS, SYSTEM_FIELD_DOCS,
} from '../../../src/lib/sme-field-docs.js';

export const metadata = {
  title: 'User guide — SME Library',
  description:
    'How the SME Library works end to end: connecting over MCP, the tools, and a complete reference for every SME field and its value ranges (expertise levels, vectors, severity, and more).',
};

const TOOLS = [
  ['Discover', [
    ['search_smes', 'Search by capability, tags, and expertise across the library and your workspace. Hybrid keyword + semantic ranking. Use this before creating or generating.'],
    ['list_smes', 'List SMEs visible to your workspace — the library, your private SMEs, or both. Sorted by quality.'],
    ['get_sme', 'Fetch the full profile of a single SME by id.'],
  ]],
  ['Author', [
    ['create_sme', 'Create a new SME in your workspace.'],
    ['generate_sme', 'Generate a new SME with AI for a given expert type; returns an existing match first if one exists (counts against your daily quota).'],
    ['update_sme', 'Update one of your SMEs; every change snapshots the prior state into version history (reversible).'],
    ['clone_sme', 'Copy a library SME (or your own) into your workspace as an editable private copy, preserving lineage.'],
    ['archive_sme', 'Archive a workspace SME — hidden from listings/search but recoverable. Replaces hard deletion.'],
  ]],
  ['Bulk', [
    ['import_smes', 'Bulk-import profiles; each row validated independently, invalid rows reported without aborting the rest.'],
    ['export_smes', 'Export your workspace SMEs as an import-ready JSON payload that feeds straight back into import_smes.'],
  ]],
  ['Improve & curate', [
    ['record_feedback', 'Record how well an SME performed in a session (0–100); rolled into a smoothed quality score.'],
    ['propose_promotion', 'Propose a workspace SME for the shared library; automated gates then a moderation queue.'],
    ['review_promotion', 'Admin: approve or reject a pending promotion, or list the queue.'],
  ]],
];

const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--line)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' };
const td = { padding: '8px 10px', borderBottom: '1px solid var(--line)', fontSize: '0.9rem', verticalAlign: 'top' };
const codePill = { fontFamily: '"SF Mono",Consolas,monospace', fontSize: '0.82rem', background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap' };

function FieldRow({ name, type, desc }) {
  return (
    <tr>
      <td style={td}><span style={codePill}>{name}</span></td>
      {type != null && <td style={{ ...td, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{type}</td>}
      <td style={td}>{desc}</td>
    </tr>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ scrollMarginTop: 80, marginBottom: 12 }} className="mk-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function Guide() {
  return (
    <>
      <section className="mk-hero" style={{ paddingBottom: 32 }}>
        <div className="mk-container">
          <span className="mk-eyebrow">Documentation</span>
          <h1>User guide</h1>
          <p className="lead">
            Everything you need to use the SME Library — connecting over MCP, the tools, the
            workflow, and a complete reference for every SME field and what its values mean.
          </p>
        </div>
      </section>

      <div className="mk-container" style={{ maxWidth: 900 }}>
        {/* Contents */}
        <nav style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '16px 20px', background: 'var(--soft)', marginBottom: 8 }}>
          <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>On this page</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', marginTop: 10 }}>
            {[
              ['what', 'What it is'], ['quickstart', 'Quickstart'], ['tools', 'The MCP tools'],
              ['workflow', 'Working with SMEs'], ['fields', 'Field reference'], ['scales', 'Value scales'],
              ['extensions', 'Extensions'], ['curation', 'Curation & quality'], ['email', 'Email setup'],
              ['selfhost', 'Self-hosting'],
            ].map(([id, label]) => <a key={id} href={`#${id}`} style={{ color: 'var(--accent-ink)', fontSize: '0.92rem' }}>{label}</a>)}
          </div>
        </nav>

        <Section id="what" title="What the SME Library is">
          <p className="sub" style={{ maxWidth: 'none' }}>
            The SME Library is a shared, quality-ranked catalog of <strong>Subject-Matter Expert
            (SME) profiles</strong> served over the Model Context Protocol (MCP). Each profile is a
            structured persona — a discipline, a way of reasoning, known strengths and blind spots,
            evidence standards, and more — that an AI agent can load to reason like a seasoned
            specialist, or that several agents can consult to pressure-test a decision from
            different vantage points. Use the hosted shared library, keep private SMEs in your own
            workspace, or self-host the whole stack.
          </p>
        </Section>

        <Section id="quickstart" title="Quickstart">
          <ol className="sub" style={{ maxWidth: 'none', paddingLeft: 20 }}>
            <li>Create an account and an API key on the <Link href="/dashboard" style={{ color: 'var(--accent-ink)' }}>dashboard</Link>.</li>
            <li>Point any MCP client at the server with that key:</li>
          </ol>
          <div className="mk-code">
            <span className="c"># Claude Code, or any MCP client</span><br />
            <span className="k">claude</span> mcp add --transport http sme-library \<br />
            &nbsp;&nbsp;https://your-deployment/api/mcp \<br />
            &nbsp;&nbsp;--header <span className="k">"Authorization: Bearer sme_live_…"</span>
          </div>
          <p className="sub" style={{ maxWidth: 'none', marginTop: 18 }}>
            Then ask your agent to <code>search_smes</code> for the expertise you need, load the
            profile, and reason in that expert’s voice. Prefer <code>clone_sme</code> over authoring
            a duplicate, and <code>record_feedback</code> after a session so the best experts rise.
          </p>
        </Section>

        <Section id="tools" title="The MCP tools">
          <p className="sub" style={{ maxWidth: 'none' }}>Thirteen tools, grouped by what you’re doing:</p>
          {TOOLS.map(([group, tools]) => (
            <div key={group} style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 8px' }}>{group}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>{tools.map(([n, d]) => <FieldRow key={n} name={n} type={null} desc={d} />)}</tbody>
              </table>
            </div>
          ))}
        </Section>

        <Section id="workflow" title="Working with SMEs">
          <p className="sub" style={{ maxWidth: 'none' }}>
            <strong>Find first.</strong> Search or list before creating — a suitable expert may
            already exist. <strong>Clone</strong> a library SME to get an editable private copy that
            keeps lineage to the original. <strong>Create</strong> or <strong>generate</strong> when
            nothing fits; generation drafts the full structured attribute set for you.
            <strong> Import/export</strong> move profiles in bulk as JSON (or the Markdown profile
            format). <strong>Give feedback</strong> to shape quality scores, and
            <strong> propose promotion</strong> to contribute a strong SME back to the shared library
            (an admin reviews it).
          </p>
        </Section>

        <Section id="fields" title="Field reference">
          <h3 style={{ fontSize: '1.05rem' }}>Core fields</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>The first-class profile fields. <code>name</code> and <code>discipline</code> are required; everything else is optional.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr><th style={th}>Field</th><th style={th}>Type</th><th style={th}>Meaning</th></tr></thead>
              <tbody>{CORE_FIELD_DOCS.map(([n, t, d]) => <FieldRow key={n} name={n} type={t} desc={d} />)}</tbody>
            </table>
          </div>

          <h3 style={{ fontSize: '1.05rem', marginTop: 30 }}>Structured attributes</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>
            The rich reasoning set, stored under <code>attributes</code>. Fields marked
            <em> (list)</em> hold a comma-separated set of values. Every field is optional — populate
            what’s meaningful for the expert.
          </p>
          {ATTRIBUTE_GROUPS.map(({ group, fields }) => (
            <div key={group} style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent-ink)', margin: '14px 0 6px' }}>{group}</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <tbody>
                    {fields.map(([key, label]) => (
                      <tr key={key}>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}><span style={codePill}>{key}</span><div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 2 }}>{label}</div></td>
                        <td style={td}>{ATTR_FIELD_DOCS[key] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <h3 style={{ fontSize: '1.05rem', marginTop: 30 }}>System fields (read-only)</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>Managed by the platform; shown when you read a profile.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <tbody>{SYSTEM_FIELD_DOCS.map(([n, d]) => <FieldRow key={n} name={n} type={null} desc={d} />)}</tbody>
            </table>
          </div>
        </Section>

        <Section id="scales" title="Value scales">
          <p className="sub" style={{ maxWidth: 'none' }}>What the constrained fields’ values mean.</p>
          {Object.entries(VALUE_SCALES).map(([key, scale]) => (
            <div key={key} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong>{scale.label}</strong>
                <span style={codePill}>{key}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{scale.kind}</span>
              </div>
              {scale.note && <p className="sub" style={{ maxWidth: 'none', margin: '8px 0 0' }}>{scale.note}</p>}
              {scale.values.length > 0 && (
                <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                  {scale.values.map(([v, meaning]) => (
                    <div key={v} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
                      <div><span style={codePill}>{v}</span></div>
                      <div style={{ fontSize: '0.9rem' }}>{meaning}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>

        <Section id="extensions" title="Extensions (domain packs)">
          <p className="sub" style={{ maxWidth: 'none' }}>
            <code>extensions</code> holds optional namespaced packs so specialists carry extra
            fields without bloating the core schema. The built-in example is <code>red_team</code>:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr><th style={th}>red_team field</th><th style={th}>Meaning</th></tr></thead>
              <tbody>
                <FieldRow name="focus" type={null} desc="What the red-team lens concentrates on for this expert." />
                <FieldRow name="adversary_model" type={null} desc="The adversary this expert reasons against — capabilities and intent." />
                <FieldRow name="severity_default" type={null} desc="Default severity for this expert’s findings. See the Severity scale." />
                <FieldRow name="weighting_adjustment" type={null} desc="Relative weight for this expert’s severity calls. See the Weighting adjustment scale." />
              </tbody>
            </table>
          </div>
          <p className="sub" style={{ maxWidth: 'none', marginTop: 14 }}>
            Packs are free-form: any object under a namespace is stored and displayed. Add your own
            (e.g. <code>clinical</code>, <code>legal</code>) for vertical fields.
          </p>
        </Section>

        <Section id="curation" title="Curation & quality">
          <p className="sub" style={{ maxWidth: 'none' }}>
            Every SME is <strong>versioned</strong> — updates snapshot the prior state, so changes
            are reversible. <code>quality_score</code> is a smoothed rolling average of
            <code> record_feedback</code> (0–100) and drives search ranking and promotion
            eligibility. To share a private SME, <code>propose_promotion</code> runs automated gates
            (usage, quality, duplication) and, if they pass, queues it for an <strong>admin</strong>
            to approve in the library console. Admins can also edit, deprecate, archive, or delete
            library entries and manage other admins from the account page.
          </p>
        </Section>

        <Section id="email" title="Email setup (confirmations & password resets)">
          <p className="sub" style={{ maxWidth: 'none' }}>
            Account confirmation and password-reset emails are sent by <strong>Supabase</strong>,
            not by this app — the app only asks Supabase to send them. If new accounts aren’t
            receiving validation emails, it’s a Supabase configuration issue. Work through these in
            order:
          </p>
          <ol className="sub" style={{ maxWidth: 'none', paddingLeft: 20, display: 'grid', gap: 10 }}>
            <li>
              <strong>Configure custom SMTP</strong> — the most common cause. Supabase’s built-in
              email service is rate-limited to a handful of messages per hour and is for testing
              only, so the rest silently fail. In the Supabase dashboard go to
              {' '}<em>Authentication → Emails → SMTP Settings</em>, enable custom SMTP, and add a
              provider (Resend, Postmark, SendGrid, or AWS SES — all have free tiers).
            </li>
            <li>
              <strong>Enable “Confirm email”</strong> under <em>Authentication → Providers → Email</em>.
              If it’s off, no email is sent and users are signed in immediately.
            </li>
            <li>
              <strong>Allow-list your URLs</strong> under <em>Authentication → URL Configuration</em>:
              set <em>Site URL</em> to your deployment and add
              {' '}<code>https://your-deployment/auth/callback</code> (and any Vercel preview URLs) to
              <em> Redirect URLs</em>. A confirmation link whose target isn’t allow-listed won’t work.
            </li>
            <li>
              <strong>Set <code>NEXT_PUBLIC_BASE_URL</code></strong> in your Vercel project to the
              canonical site URL (e.g. <code>https://your-deployment</code>). The app uses it to build
              the confirmation redirect, so a missing request origin can’t produce an invalid link.
            </li>
            <li>
              <strong>Check the logs</strong> under <em>Authentication → Logs</em> and in your SMTP
              provider’s dashboard to see send attempts and failures.
            </li>
          </ol>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Users who didn’t receive the first email can re-request it with <strong>“Resend it”</strong>
            on the sign-in page.
          </p>
        </Section>

        <Section id="selfhost" title="Self-hosting">
          <p className="sub" style={{ maxWidth: 'none' }}>
            The stack is Next.js on Vercel + Supabase (Postgres, Auth, pgvector). Clone the repo,
            apply the SQL migrations (or <code>supabase/apply-latest.sql</code>), set
            <code> SUPABASE_URL</code>, <code>SUPABASE_ANON_KEY</code>,
            <code> SUPABASE_SERVICE_ROLE_KEY</code>, and <code>ADMIN_EMAILS</code>, and deploy. See
            the repository <code>README.md</code> and <code>docs/</code> for the full setup, and
            <code> docs/USER_GUIDE.md</code> for this guide in Markdown.
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <a href="https://github.com/ADHD-IRL/SME_MCP" className="mk-btn mk-btn-primary">View on GitHub</a>
            <Link href="/dashboard" className="mk-btn mk-btn-ghost">Open the dashboard</Link>
          </div>
        </Section>
      </div>
    </>
  );
}
