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
  'synthetic profile / bio': 'persona_description',
  'synthetic profile/bio': 'persona_description',
  bio: 'persona_description',
  'professional background': 'professional_background',
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
  return String(v).split(/[,;]|\n/).map((s) => s.trim()).filter(Boolean);
}

const isBullet = (s) => /^[-*]\s+/.test(s);
const stripBullet = (s) => s.replace(/^[-*]\s+/, '').trim();

// Clean a heading into a name: drop backslash-escapes and a leading "12." /
// "12)" numbering (e.g. "1\. Domestic Violent Extremism Analyst").
function cleanName(raw) {
  return raw.replace(/\\/g, '').replace(/^\s*\d+[.)]\s*/, '').trim();
}

function slug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Parse one Markdown SME block into an import-ready profile.
// Handles: `## N. Name` (numbered), `### Section` sub-headings (ignored as
// grouping), `**Label:** value`, `**Label:**` followed by `-`/`*` bullets or
// a paragraph, and inline `* **key:** value` rating bullets.
function parseBlock(lines) {
  const attributes = {};
  const core = {};
  let name;

  const setCore = (col, value) => {
    if (col === 'tags') core.tags = splitList(value);
    else if (col === 'expertise_level') core.expertise_level = normalizeSeniority(value);
    else if (!core[col]) core[col] = value; // first wins (persona vs bio)
  };
  const setAttr = (label, payload) => {
    if (label === 'vectors') {
      const vectors = {};
      for (const b of Array.isArray(payload) ? payload : [payload]) {
        const vm = String(b).match(/(\w+)\s*:\s*(\d+)/);
        if (vm) vectors[vm[1].toLowerCase()] = Number(vm[2]);
      }
      attributes.vectors = vectors;
      return;
    }
    const key = LABEL_TO_KEY.get(label) || slug(label);
    if (Array.isArray(payload)) attributes[key] = payload;
    else attributes[key] = ARRAY_ATTRS.has(key) ? splitList(payload) : payload;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (!t) continue;

    // Any heading: first one names the SME; the rest (### sections) are ignored.
    const h = t.match(/^#{1,6}\s+(.*)$/);
    if (h) { if (!name) name = cleanName(h[1]); continue; }

    // Column-level field: **Label:** [value]
    let m = t.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    // Inline rating bullet: * **key:** value  (e.g. Domain Fluency)
    let fromBullet = false;
    if (!m) {
      const b = t.match(/^[-*]\s+\*\*(.+?):\*\*\s*(.*)$/);
      if (b) { m = b; fromBullet = true; }
    }
    if (!m) continue; // plain bullet / paragraph handled by look-ahead below

    const label = m[1].trim().toLowerCase();
    let value = m[2].trim();
    let list = null;

    // Empty inline value → the value is the following bullet list or paragraph.
    if (!fromBullet && !value) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j += 1; // skip blank lines
      if (j < lines.length && isBullet(lines[j].trim()) && !/^[-*]\s+\*\*/.test(lines[j].trim())) {
        const items = [];
        while (j < lines.length && isBullet(lines[j].trim()) && !/^[-*]\s+\*\*/.test(lines[j].trim())) {
          items.push(stripBullet(lines[j].trim()));
          j += 1;
        }
        list = items;
        i = j - 1;
      } else if (j < lines.length) {
        const para = [];
        while (j < lines.length) {
          const s = lines[j].trim();
          if (!s || /^#{1,6}\s+/.test(s) || /^\*\*/.test(s) || isBullet(s)) break;
          para.push(s);
          j += 1;
        }
        if (para.length) { value = para.join(' '); i = j - 1; }
      }
    }

    if (CORE_LABELS[label]) setCore(CORE_LABELS[label], list ? list.join(', ') : value);
    else setAttr(label, list || value);
  }

  if (!name) return null;

  const asText = (v) => (Array.isArray(v) ? v.join(', ') : v);
  const strong = attributes.strong_domains;
  const weak = attributes.weak_domains;
  const blind = attributes.blind_spots;
  const profile = {
    name,
    discipline: core.discipline || 'General',
    expertise_level: core.expertise_level,
    persona_description: core.persona_description,
    cognitive_biases: attributes.known_bias || attributes.dominant_bias,
    strengths: asText(strong),
    limitations: [asText(weak), asText(blind)].filter(Boolean).join('; ') || undefined,
    reasoning_style: attributes.cognitive_pattern,
    role_type: attributes.role_type,
    tags: core.tags || [],
    attributes,
  };
  Object.keys(profile).forEach((k) => profile[k] === undefined && delete profile[k]);
  return profile;
}

// Parse a full Markdown document of one or more SME profiles into import-ready
// profiles. Each SME begins at an h1/h2 heading (`#`/`##`); `###`+ headings are
// treated as in-profile sections, and a bare `---` also ends a profile.
export function parseSmeMarkdown(text) {
  const clean = String(text).replace(/\r\n/g, '\n');
  const lines = clean.split('\n');

  const blocks = [];
  let current = [];
  const flush = () => { if (current.some((l) => l.trim())) blocks.push(current); current = []; };

  for (const line of lines) {
    if (/^\s*---\s*$/.test(line)) { flush(); continue; }
    if (/^#{1,2}\s+/.test(line)) { flush(); current.push(line); continue; }
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
