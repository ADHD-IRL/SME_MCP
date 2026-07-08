import { z } from 'zod';
import { getVisibleSme } from '../lib/search.js';

export default {
  name: 'get_sme',
  description: 'Fetch the full profile of a single SME by ID (from the library or your workspace).',
  scope: 'read',
  schema: {
    sme_id: z.string().uuid().describe('UUID of the SME'),
  },
  async handler({ sme_id }, ctx) {
    return getVisibleSme(sme_id, ctx);
  },
};
