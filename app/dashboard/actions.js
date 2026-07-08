'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../../src/lib/supabase-ssr.js';
import { ensureWorkspace, assertMember, issueKey, revokeKey } from '../../src/lib/workspace.js';

export async function createKeyAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const workspaceId = await ensureWorkspace(user);
  const name = String(formData.get('name') || '').trim();
  const scopes = ['read', 'write', 'promote'].filter((s) => formData.get(`scope_${s}`) === 'on');

  const key = await issueKey(workspaceId, { name, scopes: scopes.length ? scopes : ['read', 'write'] });

  // Stash the one-time plaintext in a short-lived cookie so the dashboard can
  // display it once after the redirect, then clear it.
  (await cookies()).set('new_key', key, { httpOnly: true, maxAge: 60, path: '/dashboard', sameSite: 'lax' });
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function dismissNewKeyAction() {
  // Cookie mutation is allowed here (Server Action), unlike in page render.
  (await cookies()).delete('new_key');
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function revokeKeyAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const workspaceId = await ensureWorkspace(user);
  await assertMember(user, workspaceId);
  await revokeKey(workspaceId, String(formData.get('key_id')));

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
