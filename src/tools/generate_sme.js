import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { searchSmes } from '../lib/search.js';
import { generateSmeProfile } from '../lib/generate.js';
import { pickProfile, SME_SELECT } from '../lib/profile.js';

export default {
  name: 'generate_sme',
  description:
    'Generate a new SME profile with AI for a given expert type or scenario. Searches the library for an existing match first and returns it instead of generating a duplicate (pass skip_dedup to force generation). Generation counts against your daily quota.',
  scope: 'write',
  bucket: 'generations',
  audit: 'sme.generate',
  schema: {
    expert_type: z.string().min(3)
      .describe('The kind of expert needed, e.g. "site reliability engineer" or "healthcare privacy lawyer"'),
    scenario: z.string().optional()
      .describe('The scenario or project this expert will advise on'),
    focus: z.string().optional().describe('Key focus area'),
    background: z.string().optional().describe('Background hints (industry, era, notable roles)'),
    perspective: z.string().optional().describe('A bias or perspective this expert should embody'),
    skip_dedup: z.boolean().default(false)
      .describe('Skip the search-before-generate check and always generate a fresh profile'),
  },
  async handler(args, ctx) {
    // Dedup first: an existing high-quality match beats a fresh generation.
    if (!args.skip_dedup) {
      const matches = await searchSmes(
        { query: [args.expert_type, args.focus].filter(Boolean).join(' '), scope: 'all', limit: 3 },
        ctx
      );
      const strong = matches.find((m) => (m.quality_score ?? 0) >= 70);
      if (strong) {
        return {
          deduplicated: true,
          message:
            'An existing SME matches this request; returning it instead of generating a duplicate. Pass skip_dedup=true to force generation, or clone_sme to customize this one.',
          sme: strong,
        };
      }
    }

    const profile = await generateSmeProfile(args);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('smes')
      .insert({
        ...profile,
        workspace_id: ctx.workspaceId,
        status: 'active',
        visibility: 'workspace',
        source: 'generated',
        created_by: ctx.keyId,
      })
      .select(SME_SELECT)
      .single();
    if (error) throw new Error(error.message);

    await supabase.from('sme_versions').insert({
      sme_id: data.id,
      version: 1,
      profile: pickProfile(data),
      change_summary: `Generated for: ${args.expert_type}`,
      created_by: ctx.keyId,
    });

    return { deduplicated: false, sme: data };
  },
};
