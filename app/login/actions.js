'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSupabase } from '../../src/lib/supabase-ssr.js';

function readCredentials(formData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!email || !password) throw new Error('Email and password are required');
  return { email, password };
}

export async function signIn(formData) {
  const { email, password } = readCredentials(formData);
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect('/dashboard');
}

export async function signUp(formData) {
  const { email, password } = readCredentials(formData);
  const origin = (await headers()).get('origin');
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // If email confirmation is disabled, a session is returned immediately.
  if (data.session) redirect('/dashboard');
  redirect('/login?message=Check%20your%20email%20to%20confirm%20your%20account');
}
