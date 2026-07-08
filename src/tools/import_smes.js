import { z } from 'zod';
import { profileShape } from '../lib/profile.js';
import { importSmes } from '../lib/smes.js';

export default {
  name: 'import_smes',
  description:
    'Bulk-import multiple SME profiles into your workspace in one call. Each profile is validated and inserted independently — invalid rows are reported without aborting the rest. Capped at 200 per call.',
  scope: 'write',
  audit: 'sme.import',
  schema: {
    profiles: z.array(z.object(profileShape)).min(1).max(200)
      .describe('Array of SME profiles to import'),
    status: z.enum(['draft', 'active']).default('active'),
  },
  async handler({ profiles, status }, ctx) {
    return importSmes({
      workspaceId: ctx.workspaceId,
      items: profiles,
      status,
      source: 'imported',
      createdBy: ctx.keyId,
    });
  },
};
