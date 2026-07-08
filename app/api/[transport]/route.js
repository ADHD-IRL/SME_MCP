import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerTools } from '../../../src/tools/index.js';
import { resolveKey } from '../../../src/lib/auth.js';

// Streamable HTTP MCP endpoint at /api/mcp (SSE disabled — no Redis needed).
const handler = createMcpHandler(
  (server) => {
    registerTools(server, (extra) => extra?.authInfo?.extra ?? null);
  },
  { serverInfo: { name: 'sme-library', version: '0.1.0' } },
  { basePath: '/api', disableSse: true, maxDuration: 300 }
);

// Bearer-key auth: Authorization: Bearer sme_live_...
// The key resolves to a workspace + scopes; tools never see the credential.
const verifyToken = async (_req, bearerToken) => {
  const ctx = await resolveKey(bearerToken);
  if (!ctx) return undefined;
  return {
    token: bearerToken,
    clientId: ctx.workspaceId,
    scopes: ctx.scopes,
    extra: ctx,
  };
};

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
export const maxDuration = 300;
