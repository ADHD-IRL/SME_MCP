// Single source of truth for human-readable SME field documentation: what each
// field means and, where a field is constrained, the range of values and what
// they mean. Consumed by the /guide page and the docs/USER_GUIDE.md generator
// so descriptions never drift between the app and the repo docs.

// Ordered value scales referenced across many fields.
export const VALUE_SCALES = {
  expertise_level: {
    label: 'Expertise level',
    kind: 'ordered enum',
    values: [
      ['Junior', 'Early-career; competent on well-scoped tasks, needs oversight on ambiguous ones.'],
      ['Mid-level', 'Independent on most day-to-day work in the discipline.'],
      ['Senior', 'Deep, reliable judgment; sets direction on hard problems.'],
      ['Expert', 'Recognized authority; trusted on the discipline’s frontier.'],
      ['Principal', 'Field-shaping; the person others in the discipline defer to.'],
    ],
  },
  role_type: {
    label: 'Role type',
    kind: 'enum',
    values: [
      ['sme', 'Subject-matter expert — the default; reasons in-domain and gives assessments.'],
      ['challenger', 'Devil’s advocate — exists to attack the prevailing view and expose weak assumptions.'],
      ['moderator', 'Neutral facilitator — structures a multi-expert debate rather than taking a side.'],
    ],
  },
  vectors: {
    label: 'Vectors',
    kind: 'four scores, each 0–100',
    note: 'How strongly this expert’s lens is oriented toward each dimension. 0 = not their lens at all, 100 = this is the axis they see everything through. They do not sum to 100 — an expert can be high on several.',
    values: [
      ['human', 'People and social factors: insiders, human intelligence, motivation, deception, organizational behavior.'],
      ['technical', 'Technical and cyber factors: software, hardware, networks, engineering, exploitation.'],
      ['physical', 'Physical and material factors: kinetic effects, facilities, logistics, supply chain, geography.'],
      ['futures', 'Emerging and long-range factors: novel threats, second-order effects, strategic warning, horizon scanning.'],
    ],
  },
  severity: {
    label: 'Severity',
    kind: 'ordered enum',
    values: [
      ['CRITICAL', 'Catastrophic if realized; demands immediate action.'],
      ['HIGH', 'Serious; prioritize.'],
      ['MEDIUM', 'Material but bounded.'],
      ['LOW', 'Minor; track.'],
      ['INFO', 'Contextual only; no action implied.'],
    ],
  },
  weighting_adjustment: {
    label: 'Weighting adjustment',
    kind: 'multiplier',
    note: 'How much to trust this expert’s severity calls relative to peers. 1 = neutral (default), >1 amplifies their weight, <1 dampens it. Used when fusing several experts’ assessments.',
    values: [],
  },
  quality_score: {
    label: 'Quality score',
    kind: 'number 0–100 (derived)',
    note: 'A smoothed rolling average of session feedback (record_feedback). Drives search ranking and library-promotion eligibility. Not user-set.',
    values: [],
  },
};

// Core profile fields (first-class columns). type: text | text[] | enum | object.
export const CORE_FIELD_DOCS = [
  ['name', 'text', 'Display name of the expert — usually the role or title (e.g. “Counterterrorism Intelligence Analyst”). Required.'],
  ['discipline', 'text', 'Short 1–4 word domain label used to group and filter the library (e.g. “Cyber”, “Supply Chain”). Required.'],
  ['expertise_level', 'enum', 'Seniority of the expert. See the Expertise level scale.'],
  ['role_type', 'enum', 'What function the persona plays. See the Role type scale.'],
  ['persona_description', 'text', 'Narrative of who this expert is, how they think, and what they prioritize — the “voice” an agent adopts.'],
  ['professional_background', 'text', 'Career history and past roles that shaped the expert.'],
  ['reasoning_style', 'text', 'One-line summary of the analytical approach (e.g. “Analytical”, “First-principles”, “Pattern-matching”).'],
  ['cognitive_biases', 'text', 'Free-text summary of what the expert systematically over- or under-weights. (The Cognition attributes below capture this in structured form.)'],
  ['strengths', 'text', 'Where the expert is most reliable and should be trusted.'],
  ['limitations', 'text', 'Where the expert should not be treated as authoritative.'],
  ['communication_style', 'text', 'Tone, directness, and how the expert presents conclusions.'],
  ['domain_knowledge', 'text[]', 'Specific domains, technologies, or bodies of knowledge the expert commands.'],
  ['tags', 'text[]', '3–8 lowercase keywords for discovery and filtering.'],
  ['extensions', 'object', 'Optional namespaced domain packs — e.g. a red_team pack — so specialists carry extra fields without bloating the core schema. See Extensions.'],
  ['attributes', 'object', 'The full structured reasoning set (all fields in the groups below). This is where the rich, machine-usable detail lives.'],
];

// Structured reasoning attributes — descriptions keyed by attribute key. Grouped
// display + labels come from ATTRIBUTE_GROUPS in sme-schema.js; this supplies the
// meaning. Keys flagged as lists are stored/edited as comma-separated values.
export const ATTR_FIELD_DOCS = {
  // Role
  role_type: 'Mirror of the core role type inside the structured set (sme / challenger / moderator).',
  institutional_background: 'The institutions and organizations that shaped this expert’s worldview.',
  institutional_incentives: 'The structural incentives and pressures of those institutions that quietly bias judgment.',
  // Cognition
  cognitive_pattern: 'The characteristic shape of the expert’s reasoning (e.g. hypothesis-driven, analogical, checklist-based).',
  epistemic_style: 'How the expert decides what counts as knowing — what evidence earns belief.',
  decision_style: 'How the expert turns analysis into a call (e.g. decisive, consensus-seeking, precautionary).',
  known_bias: 'Biases the expert is aware of and partially compensates for.',
  dominant_bias: 'The single strongest systematic distortion in the expert’s judgment.',
  bias_trigger: 'The conditions or contexts that switch the dominant bias on.',
  debiasing_instruction: 'A prompt-time instruction that counteracts the bias when consulting this expert.',
  overconfidence_pattern: 'Where the expert is reliably overconfident relative to their accuracy.',
  // Domains
  strong_domains: 'Areas of deep, reliable expertise. (list)',
  moderate_domains: 'Areas of solid working competence. (list)',
  weak_domains: 'Areas of shallow or dated competence. (list)',
  blind_spots: 'Things the expert systematically fails to notice. (list)',
  defer_to: 'Other disciplines or experts this one should defer to. (list)',
  forbidden_overreach: 'Claims or domains where the expert must not assert authority.',
  discipline_failure_modes: 'The characteristic ways this whole discipline tends to get things wrong. (list)',
  // Evidence & sources
  trusted_sources: 'Sources the expert generally trusts.',
  distrusted_sources: 'Sources the expert generally distrusts.',
  highly_trusted_sources: 'Sources treated as near-authoritative. (list)',
  conditionally_trusted_sources: 'Sources trusted only under stated conditions. (list)',
  low_trust_sources: 'Sources treated with heavy skepticism. (list)',
  evidence_overweighted: 'Kinds of evidence the expert tends to give too much weight.',
  evidence_underweighted: 'Kinds of evidence the expert tends to give too little weight.',
  conflict_triggers: 'What reliably puts this expert in analytic conflict with others.',
  // Analysis
  adversary_model: 'The expert’s working model of the adversary — capabilities, intent, and likely options.',
  analytic_methods: 'The tradecraft and methods the expert applies. (list)',
  common_indicators: 'Signals the expert scans for. (list)',
  common_false_positives: 'Signals that commonly fool analysts in this space. (list)',
  false_negative_pattern: 'The characteristic way the expert misses a real signal.',
  // Belief updating
  fast_update_when: 'Conditions under which the expert revises beliefs quickly.',
  slow_update_when: 'Conditions under which the expert revises slowly.',
  resistant_to_update_when: 'Conditions under which the expert resists updating at all.',
  what_changes_mind: 'The specific kind of evidence that actually moves this expert.',
  // Risk posture
  risk_sensitivity: 'How strongly risk drives the expert’s conclusions (risk-tolerant → risk-averse).',
  false_negative_tolerance: 'How willing the expert is to accept a miss (letting a real threat through).',
  false_positive_tolerance: 'How willing the expert is to accept a false alarm.',
  escalation_bias: 'The expert’s lean toward escalation vs. de-escalation.',
  severity: 'The default severity the expert assigns to findings. See the Severity scale.',
  // Debate
  debate_role: 'The stance the expert takes in a structured debate (e.g. proponent, skeptic, synthesizer).',
  rebuttal_style: 'How the expert argues against opposing positions.',
  // Special
  vectors: 'Four 0–100 scores — human / technical / physical / futures. See the Vectors scale.',
};

// Read-only, system-managed fields worth knowing about when reading a profile.
export const SYSTEM_FIELD_DOCS = [
  ['id', 'Stable unique identifier (used by get_sme, clone_sme, etc.).'],
  ['status', 'Lifecycle state: active (visible), deprecated (kept, down-ranked), or archived (hidden but recoverable).'],
  ['visibility', 'workspace (private to your workspace) or library (in the shared public library).'],
  ['source', 'How the SME came to exist: user, generated, cloned, promoted, or imported.'],
  ['current_version', 'Monotonic version number; every update snapshots the prior state into history.'],
  ['cloned_from_id', 'If cloned or promoted, the id of the SME it descends from (lineage).'],
  ['usage_count', 'How many times the SME has been consulted — a popularity signal.'],
  ['quality_score', 'Derived 0–100 quality from feedback. See the Quality score scale.'],
  ['created_at / updated_at', 'Timestamps for creation and last modification.'],
];
