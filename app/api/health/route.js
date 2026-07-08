export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'sme-library-mcp',
    configured: {
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    },
  });
}
