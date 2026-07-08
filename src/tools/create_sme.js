import { z } from 'zod';
import { profileShape } from '../lib/profile.js';
import { createSme } from '../lib/smes.js';

export default {
  name: 'create_sme',
  description:
    'Create a new SME profile in your workspace. Search the library first — clone_sme is cheaper than authoring a duplicate.',
  scope: 'write',
  audit: 'sme.create',
  schema: {
    profile: z.object(profileShape).describe('The SME profile'),
    status: z.enum(['draft', 'active']).default('active'),
  },
  async handler({ profile, status }, ctx) {
    return createSme({
      workspaceId: ctx.workspaceId,
      profile,
      status,
      source: 'user',
      createdBy: ctx.keyId,
    });
  },
};
