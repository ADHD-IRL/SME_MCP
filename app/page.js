export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
      <h1>SME Library</h1>
      <p>
        A hosted <a href="https://modelcontextprotocol.io">MCP</a> server for creating, searching,
        and sharing Subject Matter Expert profiles that AI agents can consult.
      </p>
      <p>
        <a href="/dashboard" style={{ fontWeight: 600 }}>Sign in to get an API key →</a>
      </p>
      <h2>Connect</h2>
      <pre
        style={{ background: '#f4f4f4', padding: '1rem', borderRadius: 8, overflowX: 'auto' }}
      >{`claude mcp add --transport http sme-library \\
  ${process.env.NEXT_PUBLIC_BASE_URL || 'https://<this-deployment>'}/api/mcp \\
  --header "Authorization: Bearer <your-api-key>"`}</pre>
      <p>
        Tools: <code>search_smes</code>, <code>get_sme</code>, <code>list_smes</code>,{' '}
        <code>create_sme</code>, <code>update_sme</code>, <code>clone_sme</code>,{' '}
        <code>generate_sme</code>, <code>record_feedback</code>, <code>propose_promotion</code>,{' '}
        <code>archive_sme</code>.
      </p>
    </main>
  );
}
