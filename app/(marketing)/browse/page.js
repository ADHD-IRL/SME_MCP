import Link from 'next/link';
import { listPublicLibrary } from '../../../src/lib/smes.js';

export const metadata = {
  title: 'Browse the library — SME Library',
  description: 'Explore the shared, quality-ranked catalog of subject-matter experts available over MCP.',
};
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 48;

export default async function Browse({ searchParams }) {
  const params = await searchParams;
  const query = (params?.q || '').trim();
  const page = Math.max(1, Number(params?.page) || 1);

  let smes = [];
  let total = 0;
  let unavailable = false;
  try {
    const res = await listPublicLibrary({ query, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    smes = res.rows;
    total = res.total;
  } catch {
    unavailable = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = (page - 1) * PAGE_SIZE + smes.length;
  const pageHref = (p) => `/browse?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) }).toString()}`;

  return (
    <>
      <section className="mk-hero" style={{ paddingBottom: 28 }}>
        <div className="mk-container">
          <span className="mk-eyebrow">Library</span>
          <h1>Browse the experts.</h1>
          <p className="lead">
            The shared, quality-ranked catalog any connected agent can consult. Clone one into your
            workspace, or use it as a starting point for your own.
          </p>
          <form className="row" style={{ maxWidth: 520, margin: '0 auto' }} action="/browse">
            <input name="q" defaultValue={query} placeholder="Search experts — e.g. reliability, security, finance…"
              style={{ flex: 1, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 9,
                       background: 'var(--bg)', color: 'var(--ink)', fontSize: '0.98rem' }} />
            <button className="mk-btn mk-btn-primary">Search</button>
          </form>
        </div>
      </section>

      <section className="mk-section" style={{ borderTop: 'none', paddingTop: 8 }}>
        <div className="mk-container">
          {unavailable ? (
            <p className="sub mk-center" style={{ margin: '20px auto' }}>The library is warming up — check back shortly.</p>
          ) : smes.length === 0 ? (
            <div className="mk-center">
              <p className="sub" style={{ margin: '10px auto 20px' }}>
                {query ? `No experts match “${query}” yet.` : 'The library is being curated — no public experts yet.'}
              </p>
              <Link href="/dashboard" className="mk-btn mk-btn-ghost">Create the first one</Link>
            </div>
          ) : (
            <>
              <p className="sub">
                {total} expert{total === 1 ? '' : 's'} in the shared library{query ? ` matching “${query}”` : ''}
                {totalPages > 1 ? ` · showing ${firstShown}–${lastShown}` : ''}.
              </p>
              <div className="mk-grid">
                {smes.map((s) => (
                  <Link key={s.id} href={`/browse/${s.id}`} className="mk-card" style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                      <h3 style={{ marginBottom: 2 }}>{s.name}</h3>
                      {s.quality_score != null && (
                        <span className="mk-pill" style={{ whiteSpace: 'nowrap' }}>★ {s.quality_score}</span>
                      )}
                    </div>
                    <p style={{ color: 'var(--accent-ink)', fontSize: '0.85rem', margin: '0 0 8px' }}>
                      {s.discipline}{s.expertise_level ? ` · ${s.expertise_level}` : ''}
                    </p>
                    {(s.attributes?.severity || s.attributes?.vectors || (s.role_type && s.role_type !== 'sme')) && (
                      <div className="mk-pills" style={{ margin: '0 0 8px' }}>
                        {s.role_type && s.role_type !== 'sme' && <span className="mk-pill">{s.role_type}</span>}
                        {s.attributes?.severity && <span className="mk-pill">severity: {String(s.attributes.severity).toLowerCase()}</span>}
                        {s.attributes?.vectors && (
                          <span className="mk-pill">
                            H{s.attributes.vectors.human ?? '–'} · T{s.attributes.vectors.technical ?? '–'} · P{s.attributes.vectors.physical ?? '–'} · F{s.attributes.vectors.futures ?? '–'}
                          </span>
                        )}
                      </div>
                    )}
                    {s.persona_description && (
                      <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.persona_description}
                      </p>
                    )}
                    {s.tags?.length > 0 && (
                      <div className="mk-pills" style={{ marginTop: 12 }}>
                        {s.tags.slice(0, 4).map((t) => <span key={t} className="mk-pill">{t}</span>)}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 36 }}>
                  {page > 1
                    ? <Link href={pageHref(page - 1)} className="mk-btn mk-btn-ghost">← Prev</Link>
                    : <span className="mk-btn mk-btn-ghost" style={{ opacity: 0.4, pointerEvents: 'none' }}>← Prev</span>}
                  <span className="sub" style={{ margin: 0 }}>Page {page} of {totalPages}</span>
                  {page < totalPages
                    ? <Link href={pageHref(page + 1)} className="mk-btn mk-btn-ghost">Next →</Link>
                    : <span className="mk-btn mk-btn-ghost" style={{ opacity: 0.4, pointerEvents: 'none' }}>Next →</span>}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
