import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicSme } from '../../../../src/lib/smes.js';
import { ATTRIBUTE_GROUPS } from '../../../../src/lib/sme-schema.js';

function fmt(v) {
  if (Array.isArray(v)) return v.join(', ');
  if (v && typeof v === 'object') return Object.entries(v).map(([k, n]) => `${k}: ${n}`).join(' · ');
  return String(v);
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const sme = await getPublicSme(id);
    if (sme) return { title: `${sme.name} — SME Library`, description: sme.persona_description?.slice(0, 150) };
  } catch { /* fall through */ }
  return { title: 'Expert — SME Library' };
}

const SECTIONS = [
  ['persona_description', 'Persona'],
  ['professional_background', 'Background'],
  ['reasoning_style', 'Reasoning style'],
  ['strengths', 'Strengths'],
  ['limitations', 'Limitations'],
  ['cognitive_biases', 'Cognitive biases'],
  ['communication_style', 'Communication style'],
];

export default async function ExpertDetail({ params }) {
  const { id } = await params;

  let sme = null;
  try {
    sme = await getPublicSme(id);
  } catch {
    // treat backend errors as not-found for the public page
  }
  if (!sme) notFound();

  return (
    <section className="mk-section" style={{ borderTop: 'none', paddingTop: 40 }}>
      <div className="mk-container" style={{ maxWidth: 760 }}>
        <p style={{ marginBottom: 18 }}><Link href="/browse" style={{ color: 'var(--muted)' }}>← Back to library</Link></p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 'clamp(1.7rem,4vw,2.4rem)', letterSpacing: '-0.02em', margin: 0 }}>{sme.name}</h1>
          {sme.quality_score != null && <span className="mk-pill">★ {sme.quality_score} quality</span>}
        </div>
        <p style={{ color: 'var(--accent-ink)', fontWeight: 600, marginTop: 6 }}>
          {sme.discipline}{sme.expertise_level ? ` · ${sme.expertise_level}` : ''}
        </p>

        {sme.tags?.length > 0 && (
          <div className="mk-pills" style={{ margin: '14px 0 8px' }}>
            {sme.tags.map((t) => <span key={t} className="mk-pill">{t}</span>)}
          </div>
        )}

        {sme.domain_knowledge?.length > 0 && (
          <p className="sub" style={{ marginTop: 6 }}><strong style={{ color: 'var(--ink)' }}>Knows:</strong> {sme.domain_knowledge.join(' · ')}</p>
        )}

        <div style={{ marginTop: 20 }}>
          {SECTIONS.map(([field, label]) =>
            sme[field] ? (
              <div key={field} style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 4px' }}>{label}</h3>
                <p style={{ margin: 0 }}>{sme[field]}</p>
              </div>
            ) : null
          )}
        </div>

        {sme.attributes && Object.keys(sme.attributes).length > 0 && (
          <div style={{ marginTop: 28 }}>
            {ATTRIBUTE_GROUPS.map(({ group, fields }) => {
              const present = fields.filter(([key]) => sme.attributes[key] != null && String(fmt(sme.attributes[key])).trim());
              if (!present.length) return null;
              return (
                <div key={group} style={{ marginBottom: 22 }}>
                  <h2 style={{ fontSize: '1.1rem', letterSpacing: '-0.01em', margin: '0 0 10px' }}>{group}</h2>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {present.map(([key, label]) => (
                      <div key={key} style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 12 }}>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</div>
                        <div style={{ fontSize: '0.92rem' }}>{fmt(sme.attributes[key])}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {sme.attributes.vectors && (
              <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 10px' }}>Vectors</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 12 }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Human / Technical / Physical / Futures</div>
                  <div style={{ fontSize: '0.92rem' }}>{fmt(sme.attributes.vectors)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mk-card" style={{ marginTop: 26 }}>
          <h3>Use this expert</h3>
          <p style={{ marginBottom: 14 }}>Connect over MCP and clone it into your workspace, or consult it directly.</p>
          <div className="mk-code" style={{ fontSize: '0.8rem' }}>
            <span className="c"># after connecting the SME Library MCP server</span><br />
            clone_sme &#123; "sme_id": "{sme.id}" &#125;
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/dashboard" className="mk-btn mk-btn-primary">Get an API key</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
