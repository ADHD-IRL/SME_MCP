import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser, isAdminEmail } from '../../../src/lib/supabase-ssr.js';
import { ensureWorkspace } from '../../../src/lib/workspace.js';
import { listWorkspaceSmes } from '../../../src/lib/smes.js';
import { createSmeFormAction, dismissFlashAction, promoteSelectedAction } from './actions.js';
import ImportPanel from './ImportPanel.jsx';
import SmeList from './SmeList.jsx';

export const metadata = { title: 'My SMEs — SME Library' };
export const dynamic = 'force-dynamic';

export default async function MySmes() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const workspaceId = await ensureWorkspace(user);
  const admin = isAdminEmail(user.email);

  let smes = [];
  let loadError = null;
  try {
    smes = await listWorkspaceSmes(workspaceId);
  } catch (err) {
    loadError = err.message;
  }

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

      {loadError && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.8rem 1rem', margin: '1rem 0', fontSize: '0.9rem' }}>
          <strong>Couldn't load your SMEs.</strong> If you just deployed the latest update, apply the
          pending database migration (<code>supabase db push</code>) — the schema is missing the new
          columns. Details: <code>{loadError}</code>
        </div>
      )}

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
        <h2 style={h2}>Create a SME</h2>
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

      {/* Bulk import (client-driven with live progress) */}
      <section style={card}>
        <h2 style={h2}>Import SMEs</h2>
        <p style={{ fontSize: '0.9rem', color: '#555', marginTop: 0 }}>
          Paste the <strong>Markdown profile format</strong> (<code>## Name</code> headings with
          <code>**Field:**</code> lines), or a JSON array/object, or upload a <code>.json</code> /{' '}
          <code>.md</code> file. The format is auto-detected. Up to 500 at once; a progress bar shows
          status and estimated time, and invalid rows are reported without stopping the rest.
        </p>
        <ImportPanel admin={admin} />
      </section>

      {/* Existing — click a row for the full detail card; admins can select & promote */}
      <h2 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>Your SMEs</h2>
      <p style={{ color: '#777', fontSize: '0.85rem', marginTop: 0 }}>
        Click any SME to see its full profile.{admin ? ' Select one or more to promote them to the shared library.' : ''}
      </p>
      <SmeList smes={smes} admin={admin} promoteAction={promoteSelectedAction} />
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
