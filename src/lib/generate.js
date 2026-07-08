import Anthropic from '@anthropic-ai/sdk';

let client = null;
function getAnthropic() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');
    client = new Anthropic();
  }
  return client;
}

const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    discipline: { type: 'string' },
    expertise_level: { type: 'string', enum: ['Junior', 'Mid-level', 'Senior', 'Expert', 'Principal'] },
    persona_description: { type: 'string' },
    professional_background: { type: 'string' },
    reasoning_style: { type: 'string' },
    cognitive_biases: { type: 'string' },
    strengths: { type: 'string' },
    limitations: { type: 'string' },
    communication_style: { type: 'string' },
    domain_knowledge: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'name', 'discipline', 'expertise_level', 'persona_description',
    'professional_background', 'reasoning_style', 'cognitive_biases',
    'strengths', 'limitations', 'communication_style', 'domain_knowledge', 'tags',
  ],
  additionalProperties: false,
};

export async function generateSmeProfile({ expert_type, focus, background, perspective, scenario }) {
  const prompt = `Generate a Subject Matter Expert (SME) profile for an AI advisory system.
The SME will be consulted by AI agents that need a credible, well-characterized expert
perspective, so the profile must be specific, internally consistent, and honest about
the expert's blind spots.

Expert type: ${expert_type}
${scenario ? `Scenario they will advise on: ${scenario}` : ''}
${focus ? `Key focus area: ${focus}` : ''}
${background ? `Background hints: ${background}` : ''}
${perspective ? `Perspective or bias to embody: ${perspective}` : ''}

Guidelines:
- persona_description: 3-4 sentences on who this expert is, how they think, what they prioritize.
- professional_background: 2-3 sentences of concrete career history.
- reasoning_style: 1-2 sentences on analytical approach and argumentation style.
- cognitive_biases: 1-2 sentences on what this expert systematically overweights or misses.
- strengths / limitations: 1-2 sentences each; limitations must be real, not humble-brags.
- communication_style: 1 sentence.
- domain_knowledge: 3-6 specific domains or technologies.
- tags: 3-8 lowercase discovery tags.`;

  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
    max_tokens: 2048,
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
