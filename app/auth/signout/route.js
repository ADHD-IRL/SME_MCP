import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../src/lib/supabase-ssr.js';

export async function POST(request) {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
