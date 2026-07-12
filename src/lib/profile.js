import { z } from 'zod';

export const EXPERTISE_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Expert', 'Principal'];

// Domain-agnostic core profile. Domain-specific fields (red-teaming, legal,
// medical, ...) live in `extensions` as namespaced packs, e.g.
// extensions: { red_team: { adversary_model: "...", severity_default: "HIGH" } }
export const profileShape = {
  name: z.string().min(1).describe('Short descriptive name for the SME'),
  discipline: z.string().min(1).describe('2-4 word discipline label, e.g. "Distributed Systems Engineering"'),
  expertise_level: z.enum(EXPERTISE_LEVELS).optional(),
  persona_description: z.string().optional().describe('Who this expert is, how they think, what they prioritize'),
  professional_background: z.string().optional().describe('Career history and past roles'),
  reasoning_style: z.string().optional().describe('Analytical approach and argumentation style'),
  cognitive_biases: z.string().optional().describe('What this expert systematically overweights or misses'),
  strengths: z.string().optional().describe('Where this expert is most reliable'),
  limitations: z.string().optional().describe('Where this expert should not be trusted as authoritative'),
  communication_style: z.string().optional().describe('Tone, directness, and how they present conclusions'),
  domain_knowledge: z.array(z.string()).optional().describe('Specific domains, technologies, or bodies of knowledge'),
  tags: z.array(z.string()).optional().describe('3-8 lowercase tags for discovery'),
  role_type: z.string().optional().describe('e.g. "sme", "challenger", "moderator"'),
  extensions: z.record(z.string(), z.any()).optional()
    .describe('Optional namespaced domain packs, e.g. { "red_team": { "adversary_model": "..." } }'),
  attributes: z.record(z.string(), z.any()).optional()
    .describe('Full structured SME attribute set (cognitive pattern, sources, adversary model, vectors, etc.)'),
};

export const PROFILE_COLUMNS = [
  'name', 'discipline', 'expertise_level', 'persona_description',
  'professional_background', 'reasoning_style', 'cognitive_biases',
  'strengths', 'limitations', 'communication_style',
  'domain_knowledge', 'tags', 'role_type', 'extensions', 'attributes',
];

export const SME_SELECT = `id, workspace_id, ${PROFILE_COLUMNS.join(', ')}, status, visibility, current_version, source, cloned_from_id, usage_count, quality_score, created_at, updated_at`;

// Extract only profile fields from a SME row (for versioning / cloning).
export function pickProfile(row) {
  const out = {};
  for (const col of PROFILE_COLUMNS) {
    if (row[col] !== undefined && row[col] !== null) out[col] = row[col];
  }
  return out;
}
