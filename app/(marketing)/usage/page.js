import Link from 'next/link';

export const metadata = {
  title: 'Connecting Claude Code — SME Library',
  description:
    'How to connect SME Library to Claude Code over MCP: scope, keeping your key out of shell history, invisible whitespace, and verifying the connection.',
};

const th = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--line)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' };
const td = { padding: '8px 10px', borderBottom: '1px solid var(--line)', fontSize: '0.9rem', verticalAlign: 'top' };
const codePill = { fontFamily: '"SF Mono",Consolas,monospace', fontSize: '0.82rem', background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap' };
const hr = { border: 'none', borderTop: '1px solid var(--line)', margin: '10px 0' };

function Code({ children }) {
  return <pre className="mk-code" style={{ whiteSpace: 'pre', margin: '14px 0' }}>{children}</pre>;
}
function C({ children }) {
  return <code style={codePill}>{children}</code>;
}

export default function Usage() {
  return (
    <>
      <section className="mk-hero" style={{ paddingBottom: 28 }}>
        <div className="mk-container">
          <span className="mk-eyebrow">Documentation</span>
          <h1>Connecting SME Library to Claude Code</h1>
          <p className="lead">
            SME Library exposes its retrieval tools over an HTTP MCP endpoint. Claude Code talks to
            it directly — no bridge or wrapper process required.
          </p>
          <p className="sub" style={{ margin: '0 auto', maxWidth: 720 }}>
            This page covers the four things that trip people up: <strong>where the server gets
            registered, where your key ends up, invisible whitespace, and how to confirm it actually
            worked.</strong>
          </p>
        </div>
      </section>

      <div className="mk-container" style={{ maxWidth: 900 }}>
        {/* Quick start */}
        <section className="mk-section" style={{ scrollMarginTop: 80 }}>
          <h2>Quick start</h2>
          <Code>{`export SME_LIBRARY_KEY="sme_live_..."   # paste your key here, or pull from your secrets manager
claude mcp add --transport http --scope user sme-library \\
  https://<your-deployment>/api/mcp \\
  --header "Authorization: Bearer $SME_LIBRARY_KEY"`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Then open Claude Code and run <C>/mcp</C>. You should see <C>sme-library</C> listed as
            connected. If that worked and you understand why each flag is there, you are done. If
            not, keep reading.
          </p>
        </section>

        {/* 1. Scope */}
        <section className="mk-section">
          <h2>1. Scope: decide who gets this server</h2>
          <p className="sub" style={{ maxWidth: 'none' }}>
            <C>claude mcp add</C> writes the server into one of three places. The flag you pick
            determines who can use it and whether it follows you between repositories.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead><tr><th style={th}>Scope</th><th style={th}>Flag</th><th style={th}>Where it lives</th><th style={th}>Use it when</th></tr></thead>
              <tbody>
                <tr><td style={td}>Local (default)</td><td style={td}>none</td><td style={td}>Your machine, this project only</td><td style={td}>You are testing, or this is a one-off repo</td></tr>
                <tr><td style={td}>User</td><td style={td}><C>--scope user</C></td><td style={td}>Your machine, all projects</td><td style={td}>You want SME Library everywhere you work</td></tr>
                <tr><td style={td}>Project</td><td style={td}><C>--scope project</C></td><td style={td}><C>.mcp.json</C> in the repo root, committed to git</td><td style={td}>The whole team should get it automatically</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sub" style={{ maxWidth: 'none' }}>
            <strong>If you omit the flag, you get local scope</strong>, which means the server
            disappears the moment you <C>cd</C> into a different project. This is the single most
            common “it worked yesterday” complaint we get.
          </p>
          <p className="sub" style={{ maxWidth: 'none' }}>
            For most individual analysts, <C>--scope user</C> is the right answer.
          </p>
          <p className="sub" style={{ maxWidth: 'none' }}>
            When two scopes define a server with the same name, precedence is <strong>local, then
            project, then user</strong>. A local definition silently wins over a project one, which
            is worth knowing when you are debugging a teammate’s setup and yours behaves differently.
          </p>
        </section>

        {/* 2. Key hygiene */}
        <section className="mk-section">
          <h2>2. Keep the key out of your shell history</h2>
          <p className="sub" style={{ maxWidth: 'none' }}>This command works, and you should not run it:</p>
          <Code>{`# Do not do this
claude mcp add --transport http sme-library \\
  https://<your-deployment>/api/mcp \\
  --header "Authorization: Bearer sme_live_a1b2c3d4e5f6"`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Your key is now sitting in <C>~/.bash_history</C> or <C>~/.zsh_history</C> in plaintext,
            forever, on a file that gets backed up and synced. It will also show up in terminal
            scrollback, in any screen recording of your session, and in the screenshot you paste into
            Slack when you ask for help.
          </p>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Use a shell variable instead. Claude Code expands it at add time:
          </p>
          <Code>{`export SME_LIBRARY_KEY="sme_live_..."
claude mcp add --transport http --scope user sme-library \\
  https://<your-deployment>/api/mcp \\
  --header "Authorization: Bearer $SME_LIBRARY_KEY"`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Better still, put the export in a file your shell sources but git ignores, or pull it
            from your organization’s secrets manager at shell startup.
          </p>

          <h3 style={{ fontSize: '1.05rem' }}>Team setup and the version control problem</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Project scope is genuinely useful. It means a new analyst clones the repo and the SME
            Library tools are just there. But it writes a <C>.mcp.json</C> that goes into version
            control, and if you let it write your literal key, you have committed a credential.
          </p>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Write the config so the structure is shared and the secret is not. <C>.mcp.json</C>
            supports <C>{'${VAR}'}</C> expansion in the <C>url</C>, <C>headers</C>, <C>command</C>,
            <C>args</C>, and <C>env</C> fields:
          </p>
          <Code>{`{
  "mcpServers": {
    "sme-library": {
      "type": "http",
      "url": "\${SME_LIBRARY_URL:-https://<your-deployment>}/api/mcp",
      "headers": {
        "Authorization": "Bearer \${SME_LIBRARY_KEY}"
      }
    }
  }
}`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            The <C>{'${VAR:-default}'}</C> form lets you ship a sensible default URL while still
            allowing someone to point at a staging deployment. Each person supplies their own
            <C>SME_LIBRARY_KEY</C> from their own environment. Nothing sensitive is committed.
          </p>
          <div style={{ borderLeft: '3px solid var(--accent)', background: 'var(--soft)', borderRadius: '0 10px 10px 0', padding: '14px 18px', margin: '16px 0' }}>
            <strong>Controlled environments:</strong> if your repository holds CUI, ITAR-controlled
            technical data, or anything else subject to handling requirements, treat the MCP endpoint
            as an egress path and get it reviewed before you point it at a project repo. The config
            file is the easy part. The question of what leaves your boundary when a tool call fires is
            the part that needs a real answer.
          </div>
        </section>

        {/* 3. Whitespace */}
        <section className="mk-section">
          <h2>3. Whitespace you cannot see will break your key</h2>
          <p className="sub" style={{ maxWidth: 'none' }}>
            When you copy a key out of a web page, an email, or a password manager, you frequently
            pick up a trailing newline or a leading space. The token looks correct in every UI you
            inspect it in, and authentication fails anyway.
          </p>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Claude Code detects this and warns you, but it does <strong>not</strong> fix it. It uses
            the value exactly as written. The warning appears in <C>claude mcp list</C> and in
            <C>/mcp</C>, and it names the affected field without printing the value, like this:
          </p>
          <Code>{`Leading or trailing whitespace in: headers.Authorization`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            If you see that, edit the config and remove the stray character. Claude Code checks
            <C>command</C>, each <C>args</C> entry, <C>url</C>, and the keys and values under
            <C>env</C> and <C>headers</C>, so the same warning can point at any of them.
          </p>
          <p className="sub" style={{ maxWidth: 'none' }}>A quick way to strip it at the source when setting the variable:</p>
          <Code>{`export SME_LIBRARY_KEY="$(printf '%s' "$RAW_KEY" | tr -d '[:space:]')"`}</Code>
        </section>

        {/* 4. Verify */}
        <section className="mk-section">
          <h2>4. Verify, then verify again</h2>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Adding a server writes a config file. It does not prove the server answers. Run all three
            of these:
          </p>
          <Code>{`claude mcp list              # is sme-library registered, and does it show a connection error?
claude mcp get sme-library   # what URL, scope, and headers actually resolved?`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>Then inside a Claude Code session:</p>
          <Code>{`/mcp`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            <C>/mcp</C> is the one that matters. It shows live connection status and lets you expand
            the server to see the tools it is advertising. If <C>sme-library</C> appears but exposes
            zero tools, the transport connected and the authorization was rejected, which is a
            different problem from the server being unreachable.
          </p>

          <h3 style={{ fontSize: '1.05rem' }}>Troubleshooting</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead><tr><th style={th}>What you see</th><th style={th}>Most likely cause</th></tr></thead>
              <tbody>
                <tr><td style={td}>Server missing entirely after changing directories</td><td style={td}>Local scope. Re-add with <C>--scope user</C></td></tr>
                <tr><td style={td}>Connected, but no tools listed</td><td style={td}>Bad or expired key, or the header name is wrong</td></tr>
                <tr><td style={td}><C>Leading or trailing whitespace in: headers.Authorization</C></td><td style={td}>Stray newline in the pasted key, see section 3</td></tr>
                <tr><td style={td}>Works for you, not for a teammate</td><td style={td}>A local-scope definition on one machine is overriding the shared project config</td></tr>
                <tr><td style={td}>Server skipped at load time with a rename warning</td><td style={td}>Name collision with a reserved built-in server name</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Use it without Claude */}
        <section className="mk-section">
          <h2>Using SME Library without Claude</h2>
          <p className="sub" style={{ maxWidth: 'none' }}>
            MCP is an open standard and this is a plain Streamable-HTTP MCP endpoint with Bearer
            auth — Claude Code is just one client. Anything that speaks MCP can use it, and if you
            don’t want MCP at all, there’s a public REST read endpoint. The pattern is always the
            same: call a tool (usually <C>search_smes</C> then <C>get_sme</C>), get a structured
            profile back as JSON, then use it however you like — inject it as a persona/system prompt
            into <em>any</em> model, convene several for a multi-expert panel, or just read the data.
            A <C>read</C>-scoped key is all a consumer needs.
          </p>

          <h3 style={{ fontSize: '1.05rem' }}>Option 1 — another MCP client (no code)</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Cursor, Cline, Continue, Windsurf, Zed, VS Code (Copilot MCP), Goose, the OpenAI Agents
            SDK, LangChain (<C>langchain-mcp-adapters</C>), LlamaIndex — all connect to an HTTP MCP
            server. The config is always this shape:
          </p>
          <Code>{`{
  "type": "http",
  "url": "https://<your-deployment>/api/mcp",
  "headers": { "Authorization": "Bearer sme_live_..." }
}`}</Code>

          <h3 style={{ fontSize: '1.05rem' }}>Option 2 — a programmatic MCP client (any language)</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Use an MCP SDK directly and feed the result into whatever system you’re building. Python:
          </p>
          <Code>{`import asyncio
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

URL = "https://<your-deployment>/api/mcp"
HEADERS = {"Authorization": "Bearer sme_live_..."}

async def main():
    async with streamablehttp_client(URL, headers=HEADERS) as (r, w, _):
        async with ClientSession(r, w) as s:
            await s.initialize()
            hit = await s.call_tool("search_smes", {"query": "counterterrorism", "limit": 3})
            print(hit.content[0].text)                 # matches as JSON
            full = await s.call_tool("get_sme", {"sme_id": "<id-from-search>"})
            persona = full.content[0].text
            # -> inject \`persona\` into OpenAI / Gemini / a local model, or use it directly

asyncio.run(main())`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            TypeScript is the same idea with <C>@modelcontextprotocol/sdk</C> and
            <C>StreamableHTTPClientTransport</C>. <C>tools/list</C> (or <C>session.list_tools()</C>)
            returns all 13 tools and their input schemas.
          </p>

          <h3 style={{ fontSize: '1.05rem' }}>Option 3 — raw HTTP JSON-RPC (no MCP library)</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>
            SSE is disabled, so it’s plain JSON-RPC 2.0 over POST. Initialize, keep the returned
            <C>mcp-session-id</C> header, then call tools:
          </p>
          <Code>{`KEY="sme_live_..."; URL="https://<your-deployment>/api/mcp"
H=(-H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\
   -H "Accept: application/json, text/event-stream")

# 1) initialize — note the "mcp-session-id" response header
curl -si -X POST "$URL" "\${H[@]}" -d '{"jsonrpc":"2.0","id":1,"method":"initialize",
  "params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'

SID="<value from mcp-session-id header>"
# 2) signal ready
curl -s -X POST "$URL" "\${H[@]}" -H "mcp-session-id: $SID" \\
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'
# 3) call a tool
curl -s -X POST "$URL" "\${H[@]}" -H "mcp-session-id: $SID" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
       "params":{"name":"search_smes","arguments":{"query":"deception","limit":2}}}'`}</Code>

          <h3 style={{ fontSize: '1.05rem' }}>Option 4 — skip MCP entirely (public REST read)</h3>
          <p className="sub" style={{ maxWidth: 'none' }}>
            If you just want the expert <em>data</em>, there’s a public, unauthenticated, read-only
            endpoint over the shared library:
          </p>
          <Code>{`curl "https://<your-deployment>/api/library?q=counterterrorism&limit=5"
# -> { "count": n, "smes": [ { full profile incl. attributes + extensions } ] }`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            No key, no protocol — just JSON to drop into any prompt or pipeline. This reads the public
            library only; creating, cloning, feedback, and private workspaces need the MCP tools with
            a key. Read tools (<C>search_smes</C>, <C>list_smes</C>, <C>get_sme</C>) need a
            <C>read</C> scope; <C>write</C>/<C>promote</C>/<C>admin</C> are only for authoring,
            promoting, or moderating.
          </p>
        </section>

        {/* Removing or rotating */}
        <section className="mk-section">
          <h2>Removing or rotating</h2>
          <Code>{`claude mcp remove sme-library`}</Code>
          <p className="sub" style={{ maxWidth: 'none' }}>
            Then re-add with the new key. There is no in-place header update, so rotation is a remove
            and re-add. If you are on project scope, edit <C>.mcp.json</C> directly and rotate the
            environment variable instead, which is one more argument for the <C>{'${VAR}'}</C> pattern.
          </p>
        </section>

        {/* Reference */}
        <section className="mk-section">
          <h2>Reference</h2>
          <ul className="sub" style={{ maxWidth: 'none', paddingLeft: 20 }}>
            <li>Claude Code MCP documentation: <a href="https://code.claude.com/docs/en/mcp" style={{ color: 'var(--accent-ink)' }}>code.claude.com/docs/en/mcp</a></li>
            <li>SME Library API keys and rotation policy: <Link href="/dashboard" style={{ color: 'var(--accent-ink)' }}>your key management page</Link></li>
            <li>New to the platform? Start with the <Link href="/guide" style={{ color: 'var(--accent-ink)' }}>User Guide</Link>.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
