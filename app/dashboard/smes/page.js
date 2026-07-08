import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser, isAdminEmail } from '../../../src/lib/supabase-ssr.js';
import { ensureWorkspace } from '../../../src/lib/workspace.js';
import { listWorkspaceSmes } from '../../../src/lib/smes.js';
import { createSmeFormAction, importSmesFormAction, dismissFlashAction } from './actions.js';

export const metadata = { title: 'My SMEs — SME Library' };
export const dynamic = 'force-dynamic';

const SAMPLE = JSON.stringify(
  [
    {
      name: 'Senior SRE',
      discipline: 'Site Reliability Engineering',
      expertise_level: 'Senior',
      persona_description: 'Pragmatic operator focused on failure modes and blast radius.',
      domain_knowledge: ['kubernetes', 'incident response', 'observability'],
      tags: ['sre', 'reliability', 'ops'],
    },
  ],
  null,
  2
);

export default async function MySmes() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const workspaceId = await ensureWorkspace(user);
  const smes = await listWorkspaceSmes(workspaceId);
  const admin = isAdminEmail(user.email);

  const store = await cookies();
  const flash = store.get('sme_flash')?.value;

  return (
    <main style={{ maxWidth: 820, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ marginBottom: 0 }}>My SMEs</h1>
        <a href="/dashboard">← Dashboard</a>
      </div>
      <p style={{ color: '#555', marginTop: 4, display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
        <span>{smes.length} SME{smes.length === 1 ? '' : 's'} in your workspace.</span>
        {smes.length > 0 && (
          <a href="/dashboard/smes/export" download style={{ fontSize: '0.9rem' }}>Export JSON ↓</a>
        )}
      </p>

      {flash && (
        <div style={{ background: flash.startsWith('Error') ? '#fdecea' : '#eef6ec',
                      border: '1px solid #cdd', borderRadius: 8, padding: '0.7rem 1rem', margin: '1rem 0',
                      display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem' }}>{flash}</span>
          <form action={dismissFlashAction}><button style={linkBtn}>dismiss</button></form>
        </div>
      )}

      {/* Create one */}
      <section style={card}>
        <h2 style={h2}>Create an SME</h2>
        <form action={createSmeFormAction} style={{ display: 'grid', gap: '0.7rem' }}>
          <div style={row2}>
            <Field name="name" label="Name *" required />
            <Field name="discipline" label="Discipline *" required />
          </div>
          <div style={row2}>
            <Field name="expertise_level" label="Expertise level" placeholder="Junior / Mid-level / Senior / Expert / Principal" />
            <Field name="tags" label="Tags (comma-separated)" placeholder="sre, reliability" />
          </div>
          <Area name="persona_description" label="Persona description" />
          <div style={row2}>
            <Area name="professional_background" label="Professional background" />
            <Area name="reasoning_style" label="Reasoning style" />
          </div>
          <div style={row2}>
            <Area name="strengths" label="Strengths" />
            <Area name="limitations" label="Limitations" />
          </div>
          <div style={row2}>
            <Area name="cognitive_biases" label="Cognitive biases" />
            <Field name="communication_style" label="Communication style" />
          </div>
          <Field name="domain_knowledge" label="Domain knowledge (comma-separated)" placeholder="kubernetes, observability" />
          {admin && (
            <label style={{ fontSize: '0.85rem', color: '#555' }}>
              <input type="checkbox" name="to_library" /> Create directly in the shared library (admin)
            </label>
          )}
          <div><button style={primary}>Create SME</button></div>
        </form>
      </section>

      {/* Bulk import */}
      <section style={card}>
        <h2 style={h2}>Import SMEs</h2>
        <p style={{ fontSize: '0.9rem', color: '#555', marginTop: 0 }}>
          Paste the <strong>Markdown profile format</strong> (<code>## Name</code> headings with
          <code>**Field:**</code> lines, separated by <code>---</code>), or a JSON array/object, or
          upload a <code>.json</code> / <code>.md</code> file. The format is auto-detected. Up to 200
          at once; invalid rows are reported and skipped.
        </p>
        <form action={importSmesFormAction} style={{ display: 'grid', gap: '0.7rem' }}>
          <textarea name="json" rows={8} placeholder={SAMPLE} style={{ ...area, fontFamily: 'monospace', fontSize: '0.82rem' }} />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" name="file" accept="application/json,.json,.md,text/markdown" />
            {admin && (
              <label style={{ fontSize: '0.85rem', color: '#555' }}>
                <input type="checkbox" name="to_library" /> Import into the shared library (admin)
              </label>
            )}
          </div>
          <div><button style={primary}>Import</button></div>
        </form>
      </section>

      {/* Existing */}
      <h2 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>Your SMEs</h2>
      {smes.length === 0 && <p style={{ color: '#888' }}>None yet — create or import above.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <tbody>
          {smes.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
              <td style={{ padding: '0.5rem 0.4rem' }}><strong>{s.name}</strong><div style={{ color: '#777', fontSize: '0.82rem' }}>{s.discipline}</div></td>
              <td style={{ padding: '0.5rem 0.4rem', color: '#666' }}>{s.expertise_level || '—'}</td>
              <td style={{ padding: '0.5rem 0.4rem', color: '#666' }}>{s.status}</td>
              <td style={{ padding: '0.5rem 0.4rem', color: '#666' }}>{s.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function Field({ name, label, required, placeholder }) {
  return (
    <label style={{ fontSize: '0.85rem', color: '#333' }}>
      {label}
      <input name={name} required={required} placeholder={placeholder} style={input} />
    </label>
  );
}
function Area({ name, label }) {
  return (
    <label style={{ fontSize: '0.85rem', color: '#333' }}>
      {label}
      <textarea name={name} rows={2} style={area} />
    </label>
  );
}

const card = { border: '1px solid #e5e5e5', borderRadius: 10, padding: '1rem 1.25rem', margin: '1.25rem 0' };
const h2 = { marginTop: 0, fontSize: '1.1rem' };
const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' };
const input = { display: 'block', width: '100%', marginTop: 3, padding: '0.45rem', border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' };
const area = { ...input, resize: 'vertical', fontFamily: 'inherit' };
const primary = { padding: '0.55rem 1.2rem', border: 'none', borderRadius: 6, background: '#111', color: '#fff', cursor: 'pointer' };
const linkBtn = { background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.82rem' };
