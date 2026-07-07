import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateSmeProfile({ expert_type, prior_background, key_focus, bias_toward, institutional_hint, adversary_hint }) {
  const prompt = `You are building an expert agent profile for the AgentDebate strategic analysis system.
Generate a detailed agent profile for the following expert type:

Expert type: ${expert_type}
Prior background hints: ${prior_background || 'none'}
Key focus area: ${key_focus || 'none'}
Known bias toward: ${bias_toward || 'none'}
Institutional background hint: ${institutional_hint || 'none'}
Adversary lens hint: ${adversary_hint || 'none'}

Return a JSON object with exactly these fields:
{
  "name": "short descriptive name",
  "discipline": "2-4 word discipline label",
  "persona_description": "3-4 sentence description of who this expert is, how they think, what they prioritize",
  "professional_background": "2-3 sentences of career history and past roles",
  "cognitive_bias": "1-2 sentences describing what this expert systematically underweights or misses",
  "red_team_focus": "2-3 sentences on what this agent hunts for when analyzing any scenario",
  "expertise_level": "Junior or Senior or Expert or Principal",
  "reasoning_style": "1-2 sentences on analytical approach and argumentation style",
  "severity_default": "CRITICAL or HIGH or MEDIUM",
  "vector_human": 50,
  "vector_technical": 50,
  "vector_physical": 30,
  "vector_futures": 40,
  "tags": ["array", "of", "3-5", "relevant", "tags"],
  "epistemic_style": "1-2 sentences: evidence threshold, preferred collection types, tolerance for ambiguity",
  "institutional_background": "1-2 sentences: former agency or sector and organizational culture imprint",
  "conflict_triggers": "1 sentence: what arguments or sources this expert distrusts or dismisses",
  "decision_style": "1 sentence: escalation threshold and response posture under uncertainty",
  "adversary_model": "1 sentence: assumed adversary sophistication and primary threat lens",
  "institutional_incentives": "1 sentence: career or organizational incentives shaping this expert's assessments",
  "analytical_framework": "1-2 sentences: named frameworks or methodologies this SME applies",
  "source_preferences": "1 sentence: preferred source types (HUMINT, OSINT, technical telemetry, etc.)"
}

Return ONLY the JSON object.`;

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}
