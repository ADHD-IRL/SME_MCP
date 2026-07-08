import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { scopeQuery } from '../lib/search.js';
import { SME_SELECT } from '../lib/profile.js';

export default {
  name: 'list_smes',
  description:
    'List SME profiles visible to this workspace: the shared public library, your private workspace SMEs, or both. Sorted by quality score.',
  scope: 'read',
  schema: {
    scope: z.enum(['library', 'workspace', 'all']).default('all')
      .describe('Which SMEs to list'),
    status: z.enum(['draft', 'active', 'deprecated', 'archived']).optional()
      .describe('Filter by lifecycle status (default: everything except archived)'),
    limit: z.number().int().min(1).max(100).default(25),
  },
  async handler({ scope, status, limit }, ctx) {
    let q = getSupabase().from('smes').select(SME_SELECT);
    q = scopeQuery(q, scope, ctx.workspaceId);
    q = status ? q.eq('status', status) : q.neq('status', 'archived');
    q = q
      .order('quality_score', { ascending: false, nullsFirst: false })
      .order('usage_count', { ascending: false })
      .limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { count: data.length, smes: data };
  },
};
