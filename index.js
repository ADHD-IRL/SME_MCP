import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

import { schema as listSchema, handler as listHandler } from './tools/list_smes.js';
import { schema as searchSchema, handler as searchHandler } from './tools/search_smes.js';
import { schema as getSchema, handler as getHandler } from './tools/get_sme.js';
import { schema as createSchema, handler as createHandler } from './tools/create_sme.js';
import { schema as updateSchema, handler as updateHandler } from './tools/update_sme.js';
import { schema as deleteSchema, handler as deleteHandler } from './tools/delete_sme.js';
import { schema as cloneSchema, handler as cloneHandler } from './tools/clone_sme.js';
import { schema as generateSchema, handler as generateHandler } from './tools/generate_sme_for_scenario.js';
import { schema as promoteSchema, handler as promoteHandler } from './tools/promote_to_library.js';
import { schema as qualitySchema, handler as qualityHandler } from './tools/record_session_quality.js';

const TOOLS = [
  { schema: listSchema, handler: listHandler },
  { schema: searchSchema, handler: searchHandler },
  { schema: getSchema, handler: getHandler },
  { schema: createSchema, handler: createHandler },
  { schema: updateSchema, handler: updateHandler },
  { schema: deleteSchema, handler: deleteHandler },
  { schema: cloneSchema, handler: cloneHandler },
  { schema: generateSchema, handler: generateHandler },
  { schema: promoteSchema, handler: promoteHandler },
  { schema: qualitySchema, handler: qualityHandler },
];

const toolMap = Object.fromEntries(TOOLS.map(t => [t.schema.name, t.handler]));

const server = new Server(
  { name: 'agentdebate-sme', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(t => ({
    name: t.schema.name,
    description: t.schema.description,
    inputSchema: t.schema.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = toolMap[name];
  if (!handler) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    const result = await handler(args || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('AgentDebate SME MCP server running');
