// Deterministic SME enrichment. Fills every structured attribute (and the
// derived core fields) with realistic, *varied* values so a convened panel
// disagrees the way real experts do. Variation comes from four signals already
// on each SME — its dominant lens (from vectors), severity, expertise, and a
// seeded "temperament" axis — so two experts in the same discipline still
// reason, weigh evidence, and argue differently.
//
// Pure and reproducible: the same SME always enriches to the same profile
// (seeded by name). Existing, source-authored values are preserved; only empty
// fields are filled.

import { ARRAY_ATTRS } from './sme-schema.js';

// ---- seeded PRNG (mulberry32 over a string hash) ------------------------------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function sample(r, arr, n) {
  const pool = [...arr];
  const out = [];
  while (pool.length && out.length < n) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}
// clamp an index into an array after a jittered shift
const shift = (r, base, span) => base + (Math.floor(r() * (2 * span + 1)) - span);
const at = (arr, i) => arr[Math.max(0, Math.min(arr.length - 1, i))];

// ---- lenses -------------------------------------------------------------------
const LENSES = ['human', 'technical', 'physical', 'futures'];
const LENS_LABEL = { human: 'human factors', technical: 'technical & cyber', physical: 'physical & material', futures: 'futures & warning' };

function rankLenses(vectors = {}) {
  return [...LENSES].sort((a, b) => (vectors[b] ?? 0) - (vectors[a] ?? 0));
}

// ---- vocab (keyed by lens where a field is lens-specific) ---------------------
const V = {
  cognitive_pattern: {
    human: ['Reads people and networks first — reasons from motive, relationship, and pattern-of-life.', 'Builds a human map of who influences whom, then works outward to behavior.'],
    technical: ['Decomposes systems into components and failure paths; reasons from mechanism and telemetry.', 'Thinks in attack surfaces and dependencies; traces cause through the stack.'],
    physical: ['Traces material and movement; reasons from logistics, geography, and physical constraint.', 'Anchors on what must physically happen — sites, transport, and hard limits.'],
    futures: ['Reasons from trajectories and second-order effects; extrapolates weak signals into scenarios.', 'Thinks in branching futures and feedback loops rather than a single forecast.'],
  },
  epistemic_style: {
    human: ['Trusts corroborated human reporting and revealed behavior over stated intent.', 'Believes what sources do, discounts what they say; weighs access and motive.'],
    technical: ['Trusts what is measured and reproducible; treats unlogged claims as unproven.', 'Quantitative and falsifiable — a claim isn’t real until it’s instrumented.'],
    physical: ['Trusts physical evidence and provenance; wants the artifact, not the assertion.', 'Forensic — reasons from what the materials and records can be made to show.'],
    futures: ['Comfortable reasoning under deep uncertainty; treats weak signals as admissible.', 'Probabilistic and exploratory; holds several models at once rather than one truth.'],
  },
  decision_style: {
    human: ['Consensus-aware but decisive once the network picture is clear.', 'Reads the room, then commits; weighs who will act on the call.'],
    technical: ['Evidence-gated — waits for the telemetry, then acts crisply.', 'Iterative: ship a call, instrument it, revise on data.'],
    physical: ['Checklist-driven and procedural; prefers proven, repeatable options.', 'Conservative under uncertainty; won’t move faster than the logistics allow.'],
    futures: ['Options-oriented — keeps paths open and hedges rather than committing early.', 'Decides in bets and tripwires, not one irreversible call.'],
  },
  analytic_methods: {
    human: ['link analysis', 'pattern-of-life analysis', 'structured interviews', 'analysis of competing hypotheses'],
    technical: ['failure-mode analysis', 'telemetry/log correlation', 'adversary emulation', 'dependency mapping', 'reproducible testing'],
    physical: ['imagery & geospatial analysis', 'supply-chain tracing', 'site survey', 'materials forensics', 'movement analysis'],
    futures: ['scenario planning', 'backcasting', 'cross-impact analysis', 'horizon scanning', 'red-teaming'],
  },
  common_indicators: {
    human: ['unexplained changes in behavior or access', 'new relationships with parties of concern', 'motive plus opportunity aligning'],
    technical: ['anomalous telemetry against baseline', 'new or unsigned code paths', 'privilege or configuration drift'],
    physical: ['unusual movement or staging of materiel', 'facility or route reconnaissance', 'procurement of controlled items'],
    futures: ['clusters of weak signals crossing domains', 'a precursor trend accelerating', 'an enabling technology maturing'],
  },
  common_false_positives: {
    human: ['normal life stress mistaken for hostile intent', 'benign association read as conspiracy'],
    technical: ['a noisy detector firing on legitimate change', 'a benign misconfiguration read as intrusion'],
    physical: ['routine logistics mistaken for staging', 'a dual-use purchase read as hostile'],
    futures: ['a hype cycle mistaken for a real trend', 'coincident signals over-fitted into a pattern'],
  },
  false_negative_pattern: {
    human: 'Misses the quiet insider who behaves normally and stays inside their access.',
    technical: 'Misses the low-and-slow actor who lives in the noise floor and avoids new tooling.',
    physical: 'Misses the threat that reuses legitimate logistics and never trips a controlled tripwire.',
    futures: 'Misses the discontinuity — the break that no trend line predicted.',
  },
  adversary_model: {
    human: 'A patient, relationship-driven adversary who recruits and exploits trust from the inside.',
    technical: 'A capable, tooling-rich adversary who probes the stack and adapts to defenses.',
    physical: 'A resourced adversary who moves people and materiel through real-world seams.',
    futures: 'An adaptive adversary who innovates faster than doctrine and exploits the not-yet-governed.',
  },
  evidence_overweighted: {
    human: 'Source access and credibility — the story a well-placed source tells.',
    technical: 'Quantitative telemetry and reproducible tests.',
    physical: 'Physical forensics, imagery, and provenance records.',
    futures: 'Weak signals, analogies, and trend extrapolation.',
  },
  evidence_underweighted: {
    human: 'Base-rate statistics and technical instrumentation.',
    technical: 'Human context, intent, and organizational politics.',
    physical: 'Cyber indicators and soft human signals.',
    futures: 'Near-term operational detail and hard current data.',
  },
  highly_trusted_sources: {
    human: ['vetted human sources', 'multi-source corroborated reporting'],
    technical: ['first-party telemetry', 'reproducible test results', 'first-party logs'],
    physical: ['collection imagery', 'chain-of-custody records', 'physical forensics'],
    futures: ['replicated peer research', 'primary long-horizon datasets'],
  },
  conditionally_trusted_sources: {
    human: ['liaison reporting (with provenance)', 'defector accounts (pending corroboration)'],
    technical: ['threat-intel feeds (with provenance)', 'vendor advisories'],
    physical: ['commercial imagery', 'trade and shipping records'],
    futures: ['expert elicitation', 'prediction markets'],
  },
  low_trust_sources: {
    human: ['single-source rumor', 'uncorroborated walk-ins'],
    technical: ['unverified OSINT', 'anonymous forum claims'],
    physical: ['unsourced photos', 'second-hand sighting reports'],
    futures: ['pundit forecasts', 'vendor hype'],
  },
  forbidden_overreach: {
    human: 'Must not adjudicate technical feasibility or physical logistics as settled — that is another seat’s call.',
    technical: 'Must not infer human intent or strategic meaning from a technical indicator alone.',
    physical: 'Must not judge cyber or human-network questions on physical evidence alone.',
    futures: 'Must not present a scenario as a prediction, or a plausible path as a current fact.',
  },
  discipline_failure_modes: {
    human: ['over-reading intent into ambiguous behavior', 'mirror-imaging the adversary', 'trusting a charismatic source'],
    technical: ['tool-tunnel vision', 'mistaking coverage for security', 'ignoring the human in the loop'],
    physical: ['fighting the last war’s logistics', 'over-indexing on visible signatures', 'discounting cyber enablers'],
    futures: ['crying wolf on every weak signal', 'anchoring on a favored scenario', 'confusing plausible with probable'],
  },
  conflict_triggers: {
    human: 'Bristles when a quantitative case ignores source motive and human context.',
    technical: 'Bristles when a confident claim has no instrumentation behind it.',
    physical: 'Bristles when an assessment ignores whether it is physically possible.',
    futures: 'Bristles when the panel treats the present as if it will simply continue.',
  },
};

// temperament-driven axes (0 cautious … 3 contrarian)
const TEMPERAMENT = ['cautious', 'balanced', 'assertive', 'contrarian'];
const RISK_SENSITIVITY = [
  'Low — tolerates ambiguity and waits for a preponderance of evidence before acting.',
  'Moderate — acts on a solid balance of evidence.',
  'High — leans forward on thin but plausible signals.',
  'Very high — treats credible worst-cases as action-worthy on their own.',
];
const FN_TOLERANCE = [
  'Very low — a missed real threat is unacceptable; will over-warn to avoid it.',
  'Low — strongly prefers to over-warn.',
  'Moderate — balances misses against noise.',
  'High — accepts some misses to avoid crying wolf.',
];
const FP_TOLERANCE = [
  'Very low — false alarms erode credibility and are to be avoided.',
  'Low — dislikes raising alarms without corroboration.',
  'Moderate — accepts some false positives as the cost of coverage.',
  'High — comfortable flagging widely and filtering later.',
];
const ESCALATION = [
  'De-escalation-leaning — defaults to containment and proportionality.',
  'Neutral — matches response to assessed severity.',
  'Escalation-leaning — defaults to raising the alarm and widening the response.',
];
const DEBATE_ROLE = [
  'Proponent — builds and defends the leading hypothesis.',
  'Skeptic — stress-tests assumptions and hunts the disconfirming case.',
  'Synthesizer — integrates competing views into one coherent assessment.',
  'Forecaster — projects how the situation evolves under each option.',
  'Devil’s advocate — argues the strongest opposing case on principle.',
  'Mediator — keeps the panel honest about evidence and scope.',
];
const REBUTTAL = [
  'Evidence-first: leads with the data and lets it carry the argument.',
  'Socratic: exposes weak premises through pointed questions.',
  'Steelman-then-refute: restates the opponent’s best case before dismantling it.',
  'Precedent-driven: anchors on historical analogues and base rates.',
  'Mechanism-driven: attacks the causal story rather than the conclusion.',
  'Narrative reframing: recasts the problem so different facts matter.',
];
const KNOWN_BIAS = {
  human: 'Aware of a tendency to over-trust well-placed sources and to see intent where there is noise.',
  technical: 'Aware of a tendency to over-trust instrumentation and to dismiss what isn’t logged.',
  physical: 'Aware of a tendency to over-index on visible signatures and to refight the last case.',
  futures: 'Aware of a tendency to over-read weak signals and to anchor on a favored scenario.',
};
const BIAS_TRIGGER = [
  'Activates under time pressure and incomplete reporting.',
  'Activates when a prior assessment is on the line.',
  'Activates when the data flatters an existing hypothesis.',
  'Activates when the adversary looks reassuringly familiar.',
];
const DEBIASING = [
  'Force an explicit competing hypothesis and assign it a real advocate.',
  'State the key assumptions and what evidence would overturn each.',
  'Seek one disconfirming source before finalizing.',
  'Quantify confidence and separate what is known from what is inferred.',
];
const OVERCONFIDENCE = {
  human: 'Most overconfident when reading a single trusted source’s intent.',
  technical: 'Most overconfident when the dashboards are green.',
  physical: 'Most overconfident when the physical picture looks complete.',
  futures: 'Most overconfident about the timing of a change they’ve correctly foreseen.',
};
const FAST_UPDATE = [
  'Updates fast on new first-party evidence that contradicts the current read.',
  'Updates fast when a trusted peer surfaces a disconfirming fact.',
  'Updates fast once a testable prediction fails.',
];
const SLOW_UPDATE = [
  'Updates slowly on single-source or uncorroborated claims.',
  'Updates slowly when the new signal fits the adversary’s known deception playbook.',
  'Updates slowly against a long, stable base rate.',
];
const RESIST_UPDATE = [
  'Resists updating when the change would require abandoning a public assessment.',
  'Resists updating when the evidence is politically convenient to whoever produced it.',
  'Resists updating when the new story is simpler than reality usually is.',
];
const WHAT_CHANGES_MIND = [
  'Corroborated evidence from an independent second source.',
  'A failed prediction the current model can’t explain.',
  'A reproducible result that contradicts the assessment.',
];
const INSTITUTION = {
  human: 'human-intelligence and investigative services',
  technical: 'technical-collection and cyber-defense organizations',
  physical: 'operational, logistics, and force-protection commands',
  futures: 'strategic-warning, net-assessment, and academic research shops',
};
const INCENTIVES = [
  'Rewarded for avoiding surprise, which biases toward over-warning.',
  'Rewarded for finished-intelligence throughput, which biases toward confident, timely answers.',
  'Rewarded for defensible process, which biases toward caution and consensus.',
  'Rewarded for being right on the record, which biases toward slow, hedged updates.',
  'Rewarded for novel findings, which biases toward over-reading weak signals.',
];
const COMMS = [
  'Direct and terse — leads with the bottom line, then the why.',
  'Measured and caveated — quantifies uncertainty and flags assumptions.',
  'Narrative and contextual — explains the story behind the judgment.',
  'Blunt and adversarial — challenges the framing before answering it.',
];

// ---- main ---------------------------------------------------------------------
export function enrichProfile(profile, { disciplines = [] } = {}) {
  const p = { ...profile };
  const a = { ...(p.attributes || {}) };
  const r = rng(hash(p.name || JSON.stringify(p)));

  const ranked = rankLenses(a.vectors);
  const lens = ranked[0];
  const secondary = ranked[1];
  const weakLens = ranked[3];
  const sev = String(a.severity || '').toUpperCase();
  const sevRank = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0, INFO: 0 }[sev] ?? 1;
  const temperament = Math.floor(r() * TEMPERAMENT.length);

  const setStr = (k, val) => { if (!a[k] || !String(a[k]).trim()) a[k] = val; };
  const setList = (k, val) => {
    const cur = a[k];
    const empty = cur == null || (Array.isArray(cur) ? cur.length === 0 : !String(cur).trim());
    if (empty) a[k] = val;
  };

  // Role / institution (generic when the source didn't supply a specific history)
  setStr('institutional_background', `Career shaped by ${INSTITUTION[lens]} working ${p.discipline || LENS_LABEL[lens]}.`);
  setStr('institutional_incentives', pick(r, INCENTIVES));

  // Cognition
  setStr('cognitive_pattern', pick(r, V.cognitive_pattern[lens]));
  setStr('epistemic_style', pick(r, V.epistemic_style[lens]));
  setStr('decision_style', pick(r, V.decision_style[lens]));
  setStr('known_bias', KNOWN_BIAS[lens]);
  setStr('dominant_bias', `Over-weights the ${LENS_LABEL[lens]} lens and under-weights ${LENS_LABEL[weakLens]}.`);
  setStr('bias_trigger', pick(r, BIAS_TRIGGER));
  setStr('debiasing_instruction', pick(r, DEBIASING));
  setStr('overconfidence_pattern', OVERCONFIDENCE[lens]);

  // Domains — strong in own lens, weak in the opposite, defer across the panel
  const lensDomain = (l) => LENS_LABEL[l];
  setList('strong_domains', [p.discipline, lensDomain(lens), lensDomain(secondary)].filter(Boolean));
  setList('moderate_domains', [lensDomain(secondary), lensDomain(ranked[2])].filter(Boolean));
  setList('weak_domains', [lensDomain(weakLens)]);
  setList('blind_spots', [`the ${lensDomain(weakLens)} dimension`, V.discipline_failure_modes[lens][0]]);
  const others = disciplines.filter((d) => d && d !== p.discipline);
  setList('defer_to', sample(r, others.length ? others : ['adjacent disciplines'], 2 + Math.floor(r() * 2)));
  setStr('forbidden_overreach', V.forbidden_overreach[lens]);
  setList('discipline_failure_modes', V.discipline_failure_modes[lens]);

  // Evidence & sources
  setStr('trusted_sources', `Primary ${lensDomain(lens)} reporting, corroborated across sources.`);
  setStr('distrusted_sources', 'Uncorroborated, single-source, or self-interested reporting.');
  setList('highly_trusted_sources', V.highly_trusted_sources[lens]);
  setList('conditionally_trusted_sources', V.conditionally_trusted_sources[lens]);
  setList('low_trust_sources', V.low_trust_sources[lens]);
  setStr('evidence_overweighted', V.evidence_overweighted[lens]);
  setStr('evidence_underweighted', V.evidence_underweighted[lens]);
  setStr('conflict_triggers', V.conflict_triggers[lens]);

  // Analysis
  setStr('adversary_model', V.adversary_model[lens]);
  setList('analytic_methods', sample(r, V.analytic_methods[lens], 3 + Math.floor(r() * 2)));
  setList('common_indicators', V.common_indicators[lens]);
  setList('common_false_positives', V.common_false_positives[lens]);
  setStr('false_negative_pattern', V.false_negative_pattern[lens]);

  // Belief updating
  setStr('fast_update_when', pick(r, FAST_UPDATE));
  setStr('slow_update_when', pick(r, SLOW_UPDATE));
  setStr('resistant_to_update_when', pick(r, RESIST_UPDATE));
  setStr('what_changes_mind', pick(r, WHAT_CHANGES_MIND));

  // Risk posture — correlated with severity + temperament
  const aggr = temperament >= 2; // assertive/contrarian lean aggressive
  setStr('risk_sensitivity', at(RISK_SENSITIVITY, shift(r, Math.min(3, sevRank + (aggr ? 1 : 0)), 1)));
  setStr('false_negative_tolerance', at(FN_TOLERANCE, shift(r, Math.max(0, 1 - (sevRank - 1)), 1)));
  setStr('false_positive_tolerance', at(FP_TOLERANCE, shift(r, aggr ? 2 : 1, 1)));
  setStr('escalation_bias', at(ESCALATION, shift(r, sevRank >= 2 ? 2 : (temperament === 0 ? 0 : 1), 1)));

  // Debate — role_type steers the seat; temperament colors the style
  const roleType = String(a.role_type || p.role_type || 'sme').toLowerCase();
  let debateRole;
  if (roleType === 'challenger') debateRole = pick(r, [DEBATE_ROLE[1], DEBATE_ROLE[4]]);
  else if (roleType === 'moderator') debateRole = pick(r, [DEBATE_ROLE[5], DEBATE_ROLE[2]]);
  else if (lens === 'futures') debateRole = pick(r, [DEBATE_ROLE[3], DEBATE_ROLE[0], DEBATE_ROLE[2]]);
  else debateRole = pick(r, [DEBATE_ROLE[0], DEBATE_ROLE[1], DEBATE_ROLE[2], DEBATE_ROLE[3]]);
  setStr('debate_role', debateRole);
  setStr('rebuttal_style', at(REBUTTAL, temperament === 3 ? 2 : Math.floor(r() * REBUTTAL.length)));

  p.attributes = a;

  // Derived core fields — keep the flat columns consistent with the attributes.
  const asList = (k) => (Array.isArray(a[k]) ? a[k].join(', ') : a[k]);
  if (!p.reasoning_style) p.reasoning_style = a.cognitive_pattern;
  if (!p.communication_style) p.communication_style = pick(r, COMMS);
  if (!p.cognitive_biases) p.cognitive_biases = a.dominant_bias;
  if (!p.strengths) p.strengths = `Deep, reliable judgment in ${asList('strong_domains')}. ${a.analytic_methods ? 'Applies ' + asList('analytic_methods') + '.' : ''}`.trim();
  if (!p.limitations) p.limitations = `Weaker on ${asList('weak_domains')}; ${a.forbidden_overreach}`;
  if (!p.professional_background) {
    const inst = a.institutional_background ? ` Shaped by ${a.institutional_background}` : '';
    p.professional_background = `${p.expertise_level || 'Senior'}-level specialist in ${p.discipline}.${inst}`.trim();
  }

  // Normalize: any ARRAY_ATTRS accidentally left as a string becomes a list.
  for (const k of ARRAY_ATTRS) {
    if (typeof a[k] === 'string') a[k] = a[k].split(',').map((s) => s.trim()).filter(Boolean);
  }

  return p;
}
