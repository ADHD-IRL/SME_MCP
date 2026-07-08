import { z } from 'zod';
import { searchSmes } from '../lib/search.js';
import { EXPERTISE_LEVELS } from '../lib/profile.js';

export default {
  name: 'search_smes',
  description:
    'Search SME profiles by capability, tags, and expertise level across the shared library and your workspace. Use this before creating or generating a new SME — a suitable expert may already exist.',
  scope: 'read',
  schema: {
    query: z.string().optional()
      .describe('Free-text capability search, e.g. "kubernetes failure modes" or "contract negotiation"'),
    tags: z.array(z.string()).optional().describe('Require all of these tags'),
    min_expertise: z.enum(EXPERTISE_LEVELS).optional()
      .describe('Minimum expertise level'),
    scope: z.enum(['library', 'workspace', 'all']).default('all'),
    limit: z.number().int().min(1).max(50).default(10),
  },
  async handler(args, ctx) {
    const results = await searchSmes(args, ctx);
    return { count: results.length, smes: results };
  },
};
