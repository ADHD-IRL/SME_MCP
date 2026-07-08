// Embedding service — Supabase Edge Function using the built-in gte-small
// model (384 dimensions). Deploy with: supabase functions deploy embed
// Called server-to-server with the service role key; anon calls are rejected
// by default function JWT verification.

// @ts-expect-error Supabase.ai is provided by the Supabase Edge runtime
const model = new Supabase.ai.Session('gte-small');

Deno.serve(async (req) => {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'text (string) is required' }, { status: 400 });
    }
    const embedding = await model.run(text.slice(0, 8000), {
      mean_pool: true,
      normalize: true,
    });
    return Response.json({ embedding });
  } catch (err) {
    return Response.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
});
