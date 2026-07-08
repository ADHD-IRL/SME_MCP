import { z } from 'zod';
import { exportSmes } from '../lib/smes.js';

export default {
  name: 'export_smes',
  description:
    "Export your workspace's SME profiles as an import-ready JSON payload ({ exported_at, count, smes: [...] }). The smes array can be fed straight back into import_smes.",
  scope: 'read',
  schema: {
    include_archived: z.boolean().default(false)
      .describe('Include archived SMEs in the export'),
  },
  async handler({ include_archived }, ctx) {
    return exportSmes(ctx.workspaceId, { includeArchived: include_archived });
  },
};
