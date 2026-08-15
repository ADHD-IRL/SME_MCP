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

// The absolute site URL for confirmation-link redirects. Prefer an explicit
// NEXT_PUBLIC_BASE_URL (stable across proxies), then the request origin, then
// the Host header — so we never hand Supabase an invalid "null/..." redirect,
// which it rejects (and which then looks like "no email was sent").
async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : '';
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
  const emailRedirectTo = `${await siteUrl()}/auth/callback`;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // If email confirmation is disabled, a session is returned immediately.
  if (data.session) redirect('/dashboard');
  redirect('/login?message=Check%20your%20email%20to%20confirm%20your%20account.%20No%20email%3F%20Use%20Resend%20below.');
}

// Re-send the signup confirmation email for users who didn't receive the first
// one (e.g. lost to a rate limit). No-op-safe: Supabase does not reveal whether
// the address exists, so we always report success.
export async function resendConfirmation(formData) {
  const email = String(formData.get('email') || '').trim();
  if (!email) redirect('/login?error=Enter%20your%20email%20first%2C%20then%20press%20Resend');
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect('/login?message=Confirmation%20email%20re-sent.%20Check%20your%20inbox%20and%20spam.');
}
