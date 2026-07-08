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

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) throw new Error('Admin access required');
  return user;
}

export async function setStatusAction(formData) {
  await requireAdmin();
  await setLibraryStatus(String(formData.get('id')), String(formData.get('status')));
  revalidatePath('/dashboard/admin/library');
  redirect('/dashboard/admin/library');
}

export async function deleteLibraryAction(formData) {
  await requireAdmin();
  await deleteLibrarySme(String(formData.get('id')));
  revalidatePath('/dashboard/admin/library');
  redirect('/dashboard/admin/library');
}

export async function updateLibraryAction(formData) {
  await requireAdmin();
  const id = String(formData.get('id'));
  const patch = formToProfilePatch((name) => formData.get(name));
  await updateLibrarySme(id, patch, String(formData.get('change_summary') || '') || undefined);
  revalidatePath('/dashboard/admin/library');
  redirect('/dashboard/admin/library');
}
