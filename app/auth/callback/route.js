import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../src/lib/supabase-ssr.js';

// Handles the email-confirmation / magic-link redirect: exchanges the code
// for a session, then sends the user to the dashboard.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/dashboard`);
  }
  return NextResponse.redirect(`${origin}/login?error=Could%20not%20sign%20in`);
}
