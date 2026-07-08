// Canonical rich SME attribute schema + a parser for the Markdown profile
// format. Attributes are grouped for display; the parser maps the pasted
// document into { core profile fields } + { attributes }.

export const ATTRIBUTE_GROUPS = [
  {
    group: 'Role',
    fields: [
      ['role_type', 'Role Type'],
      ['institutional_background', 'Institutional Background'],
    ],
  },
  {
    group: 'Cognition',
    fields: [
      ['cognitive_pattern', 'Cognitive Pattern'],
      ['epistemic_style', 'Epistemic Style'],
      ['decision_style', 'Decision Style'],
      ['known_bias', 'Known Bias'],
      ['dominant_bias', 'Dominant Bias'],
      ['bias_trigger', 'Bias Trigger'],
      ['debiasing_instruction', 'Debiasing Instruction'],
      ['overconfidence_pattern', 'Overconfidence Pattern'],
    ],
  },
  {
    group: 'Domains',
    fields: [
      ['strong_domains', 'Strong Domains'],
      ['moderate_domains', 'Moderate Domains'],
      ['weak_domains', 'Weak Domains'],
      ['blind_spots', 'Blind Spots'],
      ['defer_to', 'Defer To'],
      ['forbidden_overreach', 'Forbidden Overreach'],
      ['discipline_failure_modes', 'Discipline Failure Modes'],
    ],
  },
  {
    group: 'Evidence & sources',
    fields: [
      ['trusted_sources', 'Trusted Sources'],
      ['distrusted_sources', 'Distrusted Sources'],
      ['highly_trusted_sources', 'Highly Trusted Sources'],
      ['conditionally_trusted_sources', 'Conditionally Trusted Sources'],
      ['low_trust_sources', 'Low Trust Sources'],
      ['evidence_overweighted', 'Evidence Overweighted'],
      ['evidence_underweighted', 'Evidence Underweighted'],
      ['conflict_triggers', 'Conflict Triggers'],
    ],
  },
  {
    group: 'Analysis',
    fields: [
      ['adversary_model', 'Adversary Model'],
      ['analytic_methods', 'Analytic Methods'],
      ['common_indicators', 'Common Indicators'],
      ['common_false_positives', 'Common False Positives'],
      ['false_negative_pattern', 'False Negative Pattern'],
    ],
  },
  {
    group: 'Belief updating',
    fields: [
      ['fast_update_when', 'Fast Update When'],
      ['slow_update_when', 'Slow Update When'],
      ['resistant_to_update_when', 'Resistant To Update When'],
      ['what_changes_mind', 'What Changes Mind'],
    ],
  },
  {
    group: 'Risk posture',
    fields: [
      ['risk_sensitivity', 'Risk Sensitivity'],
      ['false_negative_tolerance', 'False Negative Tolerance'],
      ['false_positive_tolerance', 'False Positive Tolerance'],
      ['escalation_bias', 'Escalation Bias'],
      ['severity', 'Severity'],
    ],
  },
  {
    group: 'Debate',
    fields: [
      ['debate_role', 'Debate Role'],
      ['rebuttal_style', 'Rebuttal Style'],
    ],
  },
];

// label (lowercased) -> attribute key, for the whole rich set.
const LABEL_TO_KEY = new Map();
for (const { fields } of ATTRIBUTE_GROUPS) {
  for (const [key, label] of fields) LABEL_TO_KEY.set(label.toLowerCase(), key);
}

// Core-profile labels that map to first-class columns (not attributes).
const CORE_LABELS = {
  discipline: 'discipline',
  seniority: 'expertise_level',
  persona: 'persona_description',
  tags: 'tags',
};

// Fields whose comma-separated values we keep as arrays inside attributes.
const ARRAY_ATTRS = new Set([
  'blind_spots', 'strong_domains', 'moderate_domains', 'weak_domains',
  'defer_to', 'trusted_sources', 'distrusted_sources', 'highly_trusted_sources',
  'conditionally_trusted_sources', 'low_trust_sources', 'analytic_methods',
  'common_indicators', 'common_false_positives',
]);

const SENIORITY = {
  junior: 'Junior', mid: 'Mid-level', 'mid-level': 'Mid-level', midlevel: 'Mid-level',
  senior: 'Senior', expert: 'Expert', principal: 'Principal',
};

export function normalizeSeniority(v) {
  if (!v) return undefined;
  return SENIORITY[v.trim().toLowerCase()] || undefined;
}

function splitList(v) {
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

// Parse one Markdown SME block into { profile, attributes }.
function parseBlock(lines) {
  const attributes = {};
  const core = {};
  let name;
  let i = 0;

  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    // Heading → name
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h && !name) { name = h[1].trim(); continue; }

    // **Label:** value   (value may be empty → look for following bullets)
    const m = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (!m) continue;
    const label = m[1].trim().toLowerCase();
    let value = m[2].trim();

    // Gather following "- ..." bullet lines as this field's list.
    const bullets = [];
    let j = i + 1;
    while (j < lines.length && lines[j].trim().startsWith('- ')) {
      bullets.push(lines[j].trim().slice(2).trim());
      j += 1;
    }
    if (bullets.length) { i = j - 1; }

    // Vectors → structured object {human, technical, physical, futures}
    if (label === 'vectors') {
      const vectors = {};
      for (const b of bullets) {
        const vm = b.match(/^(\w+)\s*:\s*(\d+)/);
        if (vm) vectors[vm[1].toLowerCase()] = Number(vm[2]);
      }
      attributes.vectors = vectors;
      continue;
    }

    // Core column?
    if (CORE_LABELS[label]) {
      const col = CORE_LABELS[label];
      if (col === 'tags') core.tags = splitList(value);
      else if (col === 'expertise_level') core.expertise_level = normalizeSeniority(value);
      else core[col] = value;
      continue;
    }

    // Rich attribute?
    const key = LABEL_TO_KEY.get(label);
    if (!key) continue;
    const payload = bullets.length ? bullets.join(', ') : value;
    attributes[key] = ARRAY_ATTRS.has(key) ? splitList(payload) : payload;
  }

  if (!name) return null;

  // Derive core searchable fields from the rich attributes when not set.
  const strong = attributes.strong_domains;
  const weak = attributes.weak_domains;
  const blind = attributes.blind_spots;
  const profile = {
    name,
    discipline: core.discipline || 'General',
    expertise_level: core.expertise_level,
    persona_description: core.persona_description,
    cognitive_biases: attributes.known_bias || attributes.dominant_bias,
    strengths: Array.isArray(strong) ? strong.join(', ') : strong,
    limitations: [Array.isArray(weak) ? weak.join(', ') : weak,
                  Array.isArray(blind) ? blind.join(', ') : blind].filter(Boolean).join('; ') || undefined,
    reasoning_style: attributes.cognitive_pattern,
    role_type: attributes.role_type,
    tags: core.tags || [],
    attributes,
  };
  // Drop undefined keys so validation/insert stay clean.
  Object.keys(profile).forEach((k) => profile[k] === undefined && delete profile[k]);
  return profile;
}

// Parse a full Markdown document of one or more SME profiles (separated by
// `---` and/or `##` headings) into an array of import-ready profiles.
export function parseSmeMarkdown(text) {
  const clean = String(text).replace(/\r\n/g, '\n');
  const lines = clean.split('\n');

  // Segment on lines that are a bare `---` OR a new `##`-level heading.
  const blocks = [];
  let current = [];
  const flush = () => { if (current.some((l) => l.trim())) blocks.push(current); current = []; };

  for (const line of lines) {
    const isRule = /^\s*---\s*$/.test(line);
    const isHeading = /^#{1,3}\s+/.test(line);
    if (isRule) { flush(); continue; }
    if (isHeading && current.some((l) => /^\*\*/.test(l.trim()))) { flush(); }
    current.push(line);
  }
  flush();

  const profiles = blocks.map(parseBlock).filter(Boolean);
  if (!profiles.length) throw new Error('No SME profiles found — expected "## Name" headings with **Field:** lines');
  return profiles;
}

// Heuristic: does this payload look like the Markdown profile format?
export function looksLikeMarkdown(text) {
  const t = String(text).trimStart();
  if (t.startsWith('{') || t.startsWith('[')) return false;
  return /\*\*(Discipline|Persona|Seniority|Cognitive Pattern)\s*:\*\*/i.test(t) || /^#{1,3}\s+/m.test(t);
}
