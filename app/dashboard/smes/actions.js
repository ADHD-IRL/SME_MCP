'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getCurrentUser, isAdminEmail } from '../../../src/lib/supabase-ssr.js';
import { ensureWorkspace } from '../../../src/lib/workspace.js';
import { createSme, importSmes, parseImportPayload, LIBRARY_WORKSPACE_ID } from '../../../src/lib/smes.js';

function toArray(raw) {
  return String(raw || '').split(',').map((s) => s.trim()).filter(Boolean);
}

// Admins may target the shared library directly; everyone else writes to
// their own workspace. Returns { workspaceId, visibility, source }.
async function resolveTarget(user, toLibrary) {
  if (toLibrary && isAdminEmail(user.email)) {
    return { workspaceId: LIBRARY_WORKSPACE_ID, visibility: 'library' };
  }
  return { workspaceId: await ensureWorkspace(user), visibility: 'workspace' };
}

function flash(store, msg) {
  store.set('sme_flash', msg, { httpOnly: true, maxAge: 30, path: '/dashboard/smes', sameSite: 'lax' });
}

export async function createSmeFormAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const toLibrary = formData.get('to_library') === 'on';
  const { workspaceId, visibility } = await resolveTarget(user, toLibrary);

  const profile = {
    name: String(formData.get('name') || '').trim(),
    discipline: String(formData.get('discipline') || '').trim(),
    expertise_level: String(formData.get('expertise_level') || '').trim() || undefined,
    persona_description: String(formData.get('persona_description') || '').trim() || undefined,
    professional_background: String(formData.get('professional_background') || '').trim() || undefined,
    reasoning_style: String(formData.get('reasoning_style') || '').trim() || undefined,
    cognitive_biases: String(formData.get('cognitive_biases') || '').trim() || undefined,
    strengths: String(formData.get('strengths') || '').trim() || undefined,
    limitations: String(formData.get('limitations') || '').trim() || undefined,
    communication_style: String(formData.get('communication_style') || '').trim() || undefined,
    domain_knowledge: toArray(formData.get('domain_knowledge')),
    tags: toArray(formData.get('tags')),
  };

  const store = await cookies();
  try {
    const sme = await createSme({
      workspaceId, profile, visibility,
      source: visibility === 'library' ? 'user' : 'user',
      createdBy: null,
    });
    flash(store, `Created “${sme.name}”${visibility === 'library' ? ' in the library' : ''}.`);
  } catch (err) {
    flash(store, `Error: ${err.message}`);
  }
  revalidatePath('/dashboard/smes');
  redirect('/dashboard/smes');
}

export async function importSmesFormAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const toLibrary = formData.get('to_library') === 'on';
  const { workspaceId, visibility } = await resolveTarget(user, toLibrary);

  // Payload can come from a pasted textarea or an uploaded .json file.
  let text = String(formData.get('json') || '').trim();
  const file = formData.get('file');
  if (!text && file && typeof file.text === 'function' && file.size > 0) {
    text = (await file.text()).trim();
  }

  const store = await cookies();
  try {
    if (!text) throw new Error('Paste JSON or choose a file to import');
    const items = parseImportPayload(text);
    const result = await importSmes({ workspaceId, items, visibility, source: 'imported', createdBy: null });
    let msg = `Imported ${result.imported} SME${result.imported === 1 ? '' : 's'}${visibility === 'library' ? ' into the library' : ''}.`;
    if (result.failed) {
      msg += ` ${result.failed} failed: ` + result.errors.slice(0, 5).map((e) => `#${e.index + 1} ${e.error}`).join(' | ');
    }
    flash(store, msg);
  } catch (err) {
    flash(store, `Error: ${err.message}`);
  }
  revalidatePath('/dashboard/smes');
  redirect('/dashboard/smes');
}

export async function dismissFlashAction() {
  (await cookies()).delete('sme_flash');
  redirect('/dashboard/smes');
}
