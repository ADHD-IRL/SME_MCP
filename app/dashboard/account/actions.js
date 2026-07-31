'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getCurrentUser, getServerSupabase } from '../../../src/lib/supabase-ssr.js';
import { isAdmin, grantAdmin, revokeAdmin } from '../../../src/lib/admins.js';

async function flash(msg) {
  (await cookies()).set('account_flash', msg, {
    httpOnly: true, maxAge: 30, path: '/dashboard/account', sameSite: 'lax',
  });
}

function done() {
  revalidatePath('/dashboard/account');
  redirect('/dashboard/account');
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isAdmin(user))) throw new Error('Admin access required');
  return user;
}

// Change the signed-in user's password. Runs on the user's own session
// (anon client), so it only ever affects the caller's account.
export async function updatePasswordAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');

  if (password.length < 8) await flash('Error: password must be at least 8 characters.');
  else if (password !== confirm) await flash('Error: passwords do not match.');
  else {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    await flash(error ? `Error: ${error.message}` : 'Password updated.');
  }
  done();
}

export async function dismissAccountFlashAction() {
  (await cookies()).delete('account_flash');
  redirect('/dashboard/account');
}

// Grant in-app admin to a user. Env-based admins are managed via ADMIN_EMAILS
// and are unaffected by this table.
export async function grantAdminAction(formData) {
  const admin = await requireAdmin();
  const userId = String(formData.get('user_id') || '');
  const email = String(formData.get('email') || '') || null;
  try {
    await grantAdmin({ userId, email, grantedBy: admin.id });
    await flash(`Granted admin to ${email || userId}.`);
  } catch (err) {
    await flash(`Error: ${err.message}`);
  }
  done();
}

export async function revokeAdminAction(formData) {
  const admin = await requireAdmin();
  const userId = String(formData.get('user_id') || '');
  // Guard against self-lockout: a DB-only admin can't revoke their own access
  // here (env admins keep their bootstrap access regardless).
  if (userId === admin.id) {
    await flash("Error: you can't revoke your own admin access.");
    done();
  }
  try {
    await revokeAdmin(userId);
    await flash('Admin access revoked.');
  } catch (err) {
    await flash(`Error: ${err.message}`);
  }
  done();
}
