import { requireScope } from '../lib/auth.js';
import { checkRateLimit } from '../lib/ratelimit.js';
import { audit } from '../lib/audit.js';

import listSmes from './list_smes.js';
import searchSmes from './search_smes.js';
import getSme from './get_sme.js';
import createSme from './create_sme.js';
import importSmes from './import_smes.js';
import exportSmes from './export_smes.js';
import updateSme from './update_sme.js';
import archiveSme from './archive_sme.js';
import cloneSme from './clone_sme.js';
import generateSme from './generate_sme.js';
import recordFeedback from './record_feedback.js';
import proposePromotion from './propose_promotion.js';
import reviewPromotion from './review_promotion.js';

export const TOOLS = [
  listSmes,
  searchSmes,
  getSme,
  createSme,
  importSmes,
  exportSmes,
  updateSme,
  archiveSme,
  cloneSme,
  generateSme,
  recordFeedback,
  proposePromotion,
  reviewPromotion,
];

// Register every tool on an McpServer. `getContext(extra)` maps the
// transport's auth info to { keyId, workspaceId, scopes, tier }.
export function registerTools(server, getContext) {
  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.schema },
      async (args, extra) => {
        try {
          const ctx = await getContext(extra);
          if (!ctx) throw new Error('Unauthorized: missing or invalid API key');

          requireScope(ctx, tool.scope);
          await checkRateLimit(ctx, 'requests');
          if (tool.bucket) await checkRateLimit(ctx, tool.bucket);

          const result = await tool.handler(args, ctx);

          if (tool.audit) {
            audit(ctx, tool.audit, 'sme', result?.id ?? result?.sme?.id ?? args?.sme_id, { tool: tool.name });
          }

          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
      }
    );
  }
}
