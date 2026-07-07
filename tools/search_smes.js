import { searchSmes } from '../lib/search.js';

export const schema = {
  name: 'search_smes',
  description: 'Find Subject Matter Experts by capability, domain, or scenario type. Returns ranked list with quality scores. Use before create or generate to avoid duplicating existing SMEs.',
  inputSchema: {
    type: 'object',
    properties: {
      capability: { type: 'string', description: 'Freetext capability description, e.g. "supply chain security adversarial thinking"' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Scenario tags to filter by, e.g. ["geopolitical", "supply-chain"]' },
      domain: { type: 'string', description: 'Domain or discipline keyword' },
      min_expertise: { type: 'string', description: 'Minimum expertise level: Junior, Senior, Expert, or Principal' },
      library_only: { type: 'boolean', description: 'Search only the global library' },
      workspace_id: { type: 'string', description: 'Also include SMEs from this workspace' },
      limit: { type: 'number', description: 'Max results (default 10)' },
    },
  },
};

export async function handler(params) {
  return searchSmes(params);
}
