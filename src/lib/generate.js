import Anthropic from '@anthropic-ai/sdk';

let client = null;
function getAnthropic() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');
    client = new Anthropic();
  }
  return client;
}

const LOW_MED_HIGH = { type: 'string', enum: ['low', 'medium', 'high'] };
const strArray = { type: 'array', items: { type: 'string' } };

// The rich human-matching reasoning set — the dimensions that separate a
// bona fide expert from a confident generalist. Keys match src/lib/sme-schema
// (ATTRIBUTE_GROUPS) so generated SMEs render and search exactly like imported
// ones. Stored in the smes.attributes jsonb column.
const ATTRIBUTE_PROPS = {
  cognitive_pattern: { type: 'string' },
  epistemic_style: { type: 'string' },
  decision_style: { type: 'string' },
  known_bias: { type: 'string' },
  debiasing_instruction: { type: 'string' },
  overconfidence_pattern: { type: 'string' },
  strong_domains: strArray,
  moderate_domains: strArray,
  weak_domains: strArray,
  defer_to: strArray,
  forbidden_overreach: { type: 'string' },
  discipline_failure_modes: strArray,
  trusted_sources: strArray,
  distrusted_sources: strArray,
  evidence_overweighted: { type: 'string' },
  evidence_underweighted: { type: 'string' },
  adversary_model: { type: 'string' },
  analytic_methods: strArray,
  common_indicators: strArray,
  common_false_positives: strArray,
  false_negative_pattern: { type: 'string' },
  risk_sensitivity: LOW_MED_HIGH,
  false_negative_tolerance: LOW_MED_HIGH,
  false_positive_tolerance: LOW_MED_HIGH,
  escalation_bias: { type: 'string' },
  debate_role: { type: 'string' },
  rebuttal_style: { type: 'string' },
  what_changes_mind: { type: 'string' },
  fast_update_when: { type: 'string' },
  slow_update_when: { type: 'string' },
  resistant_to_update_when: { type: 'string' },
};

const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    discipline: { type: 'string' },
    expertise_level: { type: 'string', enum: ['Junior', 'Mid-level', 'Senior', 'Expert', 'Principal'] },
    role_type: { type: 'string' },
    persona_description: { type: 'string' },
    professional_background: { type: 'string' },
    reasoning_style: { type: 'string' },
    cognitive_biases: { type: 'string' },
    strengths: { type: 'string' },
    limitations: { type: 'string' },
    communication_style: { type: 'string' },
    domain_knowledge: strArray,
    tags: strArray,
    attributes: {
      type: 'object',
      properties: ATTRIBUTE_PROPS,
      required: Object.keys(ATTRIBUTE_PROPS),
      additionalProperties: false,
    },
  },
  required: [
    'name', 'discipline', 'expertise_level', 'role_type', 'persona_description',
    'professional_background', 'reasoning_style', 'cognitive_biases', 'strengths',
    'limitations', 'communication_style', 'domain_knowledge', 'tags', 'attributes',
  ],
  additionalProperties: false,
};

export async function generateSmeProfile({ expert_type, focus, background, perspective, scenario }) {
  const prompt = `Generate a Subject Matter Expert (SME) profile for an AI advisory system that
convenes panels of experts to reason about multidisciplinary risk and futures problems.

The SME will be consulted — and cross-examined against other experts — by AI agents, so it must
read like a bona fide human specialist, not a confident generalist. Make every field specific to
THIS expert. A real expert knows the edge of their competence and defers outside it, applies
named methods, has a characteristic bias AND a habit to counter it, and treats false negatives
and false positives asymmetrically.

Expert type: ${expert_type}
${scenario ? `Scenario they will advise on: ${scenario}` : ''}
${focus ? `Key focus area: ${focus}` : ''}
${background ? `Background hints: ${background}` : ''}
${perspective ? `Perspective or bias to embody: ${perspective}` : ''}

Fill BOTH the core fields and the full attributes object:
- Core: name; discipline (2-4 words); expertise_level; role_type (e.g. "sme", "challenger",
  "red-team", "facilitator"); persona_description (3-4 sentences); professional_background;
  reasoning_style; cognitive_biases; strengths; limitations (real, not humble-brags);
  communication_style; domain_knowledge (3-6 items); tags (4-8 lowercase).
- attributes.debiasing_instruction MUST pair with known_bias — the self-correction habit that
  counters it.
- attributes expertise map: strong_domains, moderate_domains, weak_domains, defer_to (disciplines
  it yields to), forbidden_overreach (what it must never claim outside its lane).
- attributes tradecraft: common_indicators, common_false_positives, discipline_failure_modes.
- attributes risk posture: risk_sensitivity, false_negative_tolerance, false_positive_tolerance
  (low/medium/high — express a genuine asymmetry), escalation_bias.
- attributes debate: debate_role, rebuttal_style, what_changes_mind.
- attributes belief-update rules: fast_update_when, slow_update_when, resistant_to_update_when.
- attributes sources: trusted_sources, distrusted_sources; evidence_overweighted / underweighted.
- attributes also: cognitive_pattern, epistemic_style, decision_style, adversary_model,
  analytic_methods, overconfidence_pattern, false_negative_pattern.`;

  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: { format: { type: 'json_schema', schema: PROFILE_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Profile generation was declined by safety systems for this expert type');
  }

  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Profile generation returned no output');
  return JSON.parse(text);
}
