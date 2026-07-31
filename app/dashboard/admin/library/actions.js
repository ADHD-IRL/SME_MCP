'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, isAdminEmail } from '../../../../src/lib/supabase-ssr.js';
import {
  formToProfilePatch,
  updateLibrarySme,
  setLibraryStatus,
  deleteLibrarySme,
} from '../../../../src/lib/admin-library.js';
import { decidePromotion } from '../../../../src/lib/promotions.js';
import { ARRAY_ATTRS } from '../../../../src/lib/sme-schema.js';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) throw new Error('Admin access required');
  return user;
}

function back() {
  revalidatePath('/dashboard/admin/library');
  redirect('/dashboard/admin/library');
}

export async function setStatusAction(formData) {
  await requireAdmin();
  await setLibraryStatus(String(formData.get('id')), String(formData.get('status')));
  back();
}

export async function deleteLibraryAction(formData) {
  await requireAdmin();
  await deleteLibrarySme(String(formData.get('id')));
  back();
}

export async function updateLibraryAction(formData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  const patch = formToProfilePatch((name) => formData.get(name));

  // Rich attribute edits arrive as attr__<key> fields; collect into a patch
  // that updateLibrarySme merges over the existing attributes.
  const attributes = {};
  let sawAttr = false;
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('attr__')) continue;
    sawAttr = true;
    const attr = key.slice('attr__'.length);
    const raw = String(value).trim();
    attributes[attr] = ARRAY_ATTRS.has(attr)
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : raw;
  }
  if (sawAttr) patch.attributes = attributes;

  await updateLibrarySme(id, patch, String(formData.get('change_summary') || '') || undefined);
  back();
}

// Bulk status change / delete over a set of selected library SME ids.
export async function bulkStatusAction(formData) {
  await requireAdmin();
  const status = String(formData.get('status'));
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  for (const id of ids) {
    try { await setLibraryStatus(id, status); } catch { /* skip individual failures */ }
  }
  back();
}

export async function bulkDeleteAction(formData) {
  await requireAdmin();
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  for (const id of ids) {
    try { await deleteLibrarySme(id); } catch { /* skip */ }
  }
  back();
}

// Moderate a pending promotion from within the console.
export async function decidePromotionAction(formData) {
  const user = await requireAdmin();
  await decidePromotion({
    promotionId: String(formData.get('promotion_id')),
    decision: String(formData.get('decision')),
    notes: String(formData.get('notes') || '') || undefined,
    reviewerId: null,
  });
  back();
}
