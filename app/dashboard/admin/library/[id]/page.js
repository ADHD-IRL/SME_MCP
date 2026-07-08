import { redirect } from 'next/navigation';
import { getCurrentUser, isAdminEmail } from '../../../../../src/lib/supabase-ssr.js';
import { getLibrarySme } from '../../../../../src/lib/admin-library.js';
import { updateLibraryAction } from '../actions.js';

export const metadata = { title: 'Edit library SME' };
export const dynamic = 'force-dynamic';

const TEXT_FIELDS = [
  ['name', 'Name', false],
  ['discipline', 'Discipline', false],
  ['expertise_level', 'Expertise level (Junior/Mid-level/Senior/Expert/Principal)', false],
  ['persona_description', 'Persona description', true],
  ['professional_background', 'Professional background', true],
  ['reasoning_style', 'Reasoning style', true],
  ['cognitive_biases', 'Cognitive biases', true],
  ['strengths', 'Strengths', true],
  ['limitations', 'Limitations', true],
  ['communication_style', 'Communication style', true],
];

export default async function EditLibrarySme({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) {
    return (
      <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem' }}>
        <h1>Edit library SME</h1>
        <p style={{ color: '#a12' }}>Admin access required.</p>
      </main>
    );
  }

  const { id } = await params;
  const sme = await getLibrarySme(id);

  return (
    <main style={{ maxWidth: 720, margin: '3rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <p><a href="/dashboard/admin/library">← Library management</a></p>
      <h1 style={{ marginBottom: 0 }}>Edit: {sme.name}</h1>
      <p style={{ color: '#666', marginTop: 4, fontSize: '0.9rem' }}>
        Library entry · version {sme.current_version} · {sme.status} · saving creates a new version snapshot.
      </p>

      <form action={updateLibraryAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1rem' }}>
        <input type="hidden" name="id" value={sme.id} />

        {TEXT_FIELDS.map(([field, label, multiline]) => (
          <label key={field} style={{ fontSize: '0.9rem', color: '#333' }}>
            {label}
            {multiline ? (
              <textarea name={field} defaultValue={sme[field] ?? ''} rows={3} style={area} />
            ) : (
              <input name={field} defaultValue={sme[field] ?? ''} style={input} />
            )}
          </label>
        ))}

        <label style={{ fontSize: '0.9rem', color: '#333' }}>
          Domain knowledge (comma-separated)
          <input name="domain_knowledge" defaultValue={(sme.domain_knowledge ?? []).join(', ')} style={input} />
        </label>
        <label style={{ fontSize: '0.9rem', color: '#333' }}>
          Tags (comma-separated)
          <input name="tags" defaultValue={(sme.tags ?? []).join(', ')} style={input} />
        </label>

        <label style={{ fontSize: '0.9rem', color: '#333' }}>
          Change summary (optional)
          <input name="change_summary" placeholder="What changed and why" style={input} />
        </label>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={primary}>Save new version</button>
          <a href="/dashboard/admin/library" style={{ ...secondary, textDecoration: 'none', display: 'inline-block' }}>Cancel</a>
        </div>
      </form>
    </main>
  );
}

const input = { display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.95rem', boxSizing: 'border-box' };
const area = { ...input, resize: 'vertical', fontFamily: 'inherit' };
const primary = { padding: '0.55rem 1.2rem', border: 'none', borderRadius: 6, background: '#111', color: '#fff', cursor: 'pointer' };
const secondary = { padding: '0.55rem 1.2rem', border: '1px solid #111', borderRadius: 6, background: '#fff', color: '#111' };
