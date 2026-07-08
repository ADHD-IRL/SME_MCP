import { getSupabase } from './supabase.js';

// All embedding work is fail-soft: if the edge function isn't deployed or
// errors, writes still succeed and search falls back to keyword FTS.

export async function embedText(text) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || !text) return null;

    const res = await fetch(`${url}/functions/v1/embed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const { embedding } = await res.json();
    return Array.isArray(embedding) ? embedding : null;
  } catch {
    return null;
  }
}

// The text an SME is embedded on: identity + how they think + what they know.
export function smeEmbeddingText(row) {
  return [
    row.name,
    row.discipline,
    row.persona_description,
    row.professional_background,
    row.reasoning_style,
    (row.domain_knowledge ?? []).join(', '),
    (row.tags ?? []).join(', '),
  ]
    .filter(Boolean)
    .join('\n');
}

// Compute and store the embedding for an SME row. Fail-soft.
export async function embedSme(row) {
  const embedding = await embedText(smeEmbeddingText(row));
  if (!embedding) return false;
  const { error } = await getSupabase()
    .from('smes')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', row.id);
  return !error;
}
