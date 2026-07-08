import { createClient } from '@supabase/supabase-js';

// Lazy singleton so `next build` can evaluate route modules without env vars.
let client = null;

export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error('SUPABASE_URL is not configured');
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

export const LIBRARY_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
