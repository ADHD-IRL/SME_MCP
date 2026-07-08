#!/usr/bin/env node
// Local development transport. Reuses the exact same tool registry as the
// HTTP deployment; auth context is resolved once at startup from SME_API_KEY.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from '../src/tools/index.js';
import { resolveKey } from '../src/lib/auth.js';

const key = process.env.SME_API_KEY;
if (!key) {
  console.error('SME_API_KEY is required (an sme_live_... key for this server)');
  process.exit(1);
}

const ctx = await resolveKey(key);
if (!ctx) {
  console.error('SME_API_KEY is invalid, expired, or revoked');
  process.exit(1);
}

const server = new McpServer({ name: 'sme-library', version: '0.1.0' });
registerTools(server, () => ctx);

await server.connect(new StdioServerTransport());
console.error(`SME Library MCP (stdio) — workspace ${ctx.workspaceId}, scopes: ${ctx.scopes.join(',')}`);
