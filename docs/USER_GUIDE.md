# SME Library — User Guide

> Generated from `src/lib/sme-field-docs.js` via `scripts/gen-user-guide.mjs`. Edit the
> source, not this file. The same content is served in-app at `/guide`.

The SME Library is a shared, quality-ranked catalog of **Subject-Matter Expert (SME) profiles**
served over the Model Context Protocol (MCP). Each profile is a structured persona — a discipline,
a way of reasoning, known strengths and blind spots, evidence standards, and more — that an AI
agent can load to reason like a seasoned specialist, or that several agents can consult to
pressure-test a decision from different vantage points. Use the hosted shared library, keep private
SMEs in your own workspace, or self-host the whole stack.

## Contents
- [Quickstart](#quickstart)
- [The MCP tools](#the-mcp-tools)
- [Working with SMEs](#working-with-smes)
- [Field reference](#field-reference)
- [Value scales](#value-scales)
- [Extensions (domain packs)](#extensions-domain-packs)
- [Curation & quality](#curation--quality)
- [Self-hosting](#self-hosting)

## Quickstart
1. Create an account and an API key on the dashboard (`/dashboard`).
2. Point any MCP client at the server with that key:

```bash
claude mcp add --transport http sme-library \
  https://your-deployment/api/mcp \
  --header "Authorization: Bearer sme_live_…"
```

Then ask your agent to `search_smes` for the expertise you need, load the profile, and reason in
that expert's voice. Prefer `clone_sme` over authoring a duplicate, and `record_feedback` after a
session so the best experts rise.

## The MCP tools
Thirteen tools, grouped by what you're doing.


### Discover

| Tool | What it does |
| --- | --- |
| `search_smes` | Search by capability, tags, and expertise across the library and your workspace (hybrid keyword + semantic). Use before creating or generating. |
| `list_smes` | List SMEs visible to your workspace — the library, your private SMEs, or both. Sorted by quality. |
| `get_sme` | Fetch the full profile of a single SME by id. |

### Author

| Tool | What it does |
| --- | --- |
| `create_sme` | Create a new SME in your workspace. |
| `generate_sme` | Generate a new SME with AI; returns an existing match first if one exists (counts against your daily quota). |
| `update_sme` | Update one of your SMEs; every change snapshots the prior state (reversible). |
| `clone_sme` | Copy a library SME (or your own) into your workspace as an editable copy, preserving lineage. |
| `archive_sme` | Archive a workspace SME — hidden but recoverable. Replaces hard deletion. |

### Bulk

| Tool | What it does |
| --- | --- |
| `import_smes` | Bulk-import profiles; each row validated independently, invalid rows reported without aborting. |
| `export_smes` | Export your workspace SMEs as an import-ready JSON payload for import_smes. |

### Improve & curate

| Tool | What it does |
| --- | --- |
| `record_feedback` | Record how well an SME performed (0–100); rolled into a smoothed quality score. |
| `propose_promotion` | Propose a workspace SME for the shared library; automated gates then a moderation queue. |
| `review_promotion` | Admin: approve or reject a pending promotion, or list the queue. |

## Working with SMEs
**Find first.** Search or list before creating — a suitable expert may already exist. **Clone** a
library SME to get an editable private copy that keeps lineage to the original. **Create** or
**generate** when nothing fits; generation drafts the full structured attribute set for you.
**Import/export** move profiles in bulk as JSON (or the Markdown profile format). **Give feedback**
to shape quality scores, and **propose promotion** to contribute a strong SME back to the shared
library (an admin reviews it).

## Field reference

### Core fields
`name` and `discipline` are required; everything else is optional.

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | text | Display name of the expert — usually the role or title (e.g. “Counterterrorism Intelligence Analyst”). Required. |
| `discipline` | text | Short 1–4 word domain label used to group and filter the library (e.g. “Cyber”, “Supply Chain”). Required. |
| `expertise_level` | enum | Seniority of the expert. See the Expertise level scale. |
| `role_type` | enum | What function the persona plays. See the Role type scale. |
| `persona_description` | text | Narrative of who this expert is, how they think, and what they prioritize — the “voice” an agent adopts. |
| `professional_background` | text | Career history and past roles that shaped the expert. |
| `reasoning_style` | text | One-line summary of the analytical approach (e.g. “Analytical”, “First-principles”, “Pattern-matching”). |
| `cognitive_biases` | text | Free-text summary of what the expert systematically over- or under-weights. (The Cognition attributes below capture this in structured form.) |
| `strengths` | text | Where the expert is most reliable and should be trusted. |
| `limitations` | text | Where the expert should not be treated as authoritative. |
| `communication_style` | text | Tone, directness, and how the expert presents conclusions. |
| `domain_knowledge` | text[] | Specific domains, technologies, or bodies of knowledge the expert commands. |
| `tags` | text[] | 3–8 lowercase keywords for discovery and filtering. |
| `extensions` | object | Optional namespaced domain packs — e.g. a red_team pack — so specialists carry extra fields without bloating the core schema. See Extensions. |
| `attributes` | object | The full structured reasoning set (all fields in the groups below). This is where the rich, machine-usable detail lives. |

### Structured attributes
The rich reasoning set, stored under `attributes`. Fields marked *(list)* hold a comma-separated
set of values. Every field is optional.

#### Role

| Field | Label | Meaning |
| --- | --- | --- |
| `role_type` | Role Type | Mirror of the core role type inside the structured set (sme / challenger / moderator). |
| `institutional_background` | Institutional Background | The institutions and organizations that shaped this expert’s worldview. |
| `institutional_incentives` | Institutional Incentives | The structural incentives and pressures of those institutions that quietly bias judgment. |

#### Cognition

| Field | Label | Meaning |
| --- | --- | --- |
| `cognitive_pattern` | Cognitive Pattern | The characteristic shape of the expert’s reasoning (e.g. hypothesis-driven, analogical, checklist-based). |
| `epistemic_style` | Epistemic Style | How the expert decides what counts as knowing — what evidence earns belief. |
| `decision_style` | Decision Style | How the expert turns analysis into a call (e.g. decisive, consensus-seeking, precautionary). |
| `known_bias` | Known Bias | Biases the expert is aware of and partially compensates for. |
| `dominant_bias` | Dominant Bias | The single strongest systematic distortion in the expert’s judgment. |
| `bias_trigger` | Bias Trigger | The conditions or contexts that switch the dominant bias on. |
| `debiasing_instruction` | Debiasing Instruction | A prompt-time instruction that counteracts the bias when consulting this expert. |
| `overconfidence_pattern` | Overconfidence Pattern | Where the expert is reliably overconfident relative to their accuracy. |

#### Domains

| Field | Label | Meaning |
| --- | --- | --- |
| `strong_domains` | Strong Domains | Areas of deep, reliable expertise. (list) |
| `moderate_domains` | Moderate Domains | Areas of solid working competence. (list) |
| `weak_domains` | Weak Domains | Areas of shallow or dated competence. (list) |
| `blind_spots` | Blind Spots | Things the expert systematically fails to notice. (list) |
| `defer_to` | Defer To | Other disciplines or experts this one should defer to. (list) |
| `forbidden_overreach` | Forbidden Overreach | Claims or domains where the expert must not assert authority. |
| `discipline_failure_modes` | Discipline Failure Modes | The characteristic ways this whole discipline tends to get things wrong. (list) |

#### Evidence & sources

| Field | Label | Meaning |
| --- | --- | --- |
| `trusted_sources` | Trusted Sources | Sources the expert generally trusts. |
| `distrusted_sources` | Distrusted Sources | Sources the expert generally distrusts. |
| `highly_trusted_sources` | Highly Trusted Sources | Sources treated as near-authoritative. (list) |
| `conditionally_trusted_sources` | Conditionally Trusted Sources | Sources trusted only under stated conditions. (list) |
| `low_trust_sources` | Low Trust Sources | Sources treated with heavy skepticism. (list) |
| `evidence_overweighted` | Evidence Overweighted | Kinds of evidence the expert tends to give too much weight. |
| `evidence_underweighted` | Evidence Underweighted | Kinds of evidence the expert tends to give too little weight. |
| `conflict_triggers` | Conflict Triggers | What reliably puts this expert in analytic conflict with others. |

#### Analysis

| Field | Label | Meaning |
| --- | --- | --- |
| `adversary_model` | Adversary Model | The expert’s working model of the adversary — capabilities, intent, and likely options. |
| `analytic_methods` | Analytic Methods | The tradecraft and methods the expert applies. (list) |
| `common_indicators` | Common Indicators | Signals the expert scans for. (list) |
| `common_false_positives` | Common False Positives | Signals that commonly fool analysts in this space. (list) |
| `false_negative_pattern` | False Negative Pattern | The characteristic way the expert misses a real signal. |

#### Belief updating

| Field | Label | Meaning |
| --- | --- | --- |
| `fast_update_when` | Fast Update When | Conditions under which the expert revises beliefs quickly. |
| `slow_update_when` | Slow Update When | Conditions under which the expert revises slowly. |
| `resistant_to_update_when` | Resistant To Update When | Conditions under which the expert resists updating at all. |
| `what_changes_mind` | What Changes Mind | The specific kind of evidence that actually moves this expert. |

#### Risk posture

| Field | Label | Meaning |
| --- | --- | --- |
| `risk_sensitivity` | Risk Sensitivity | How strongly risk drives the expert’s conclusions (risk-tolerant → risk-averse). |
| `false_negative_tolerance` | False Negative Tolerance | How willing the expert is to accept a miss (letting a real threat through). |
| `false_positive_tolerance` | False Positive Tolerance | How willing the expert is to accept a false alarm. |
| `escalation_bias` | Escalation Bias | The expert’s lean toward escalation vs. de-escalation. |
| `severity` | Severity | The default severity the expert assigns to findings. See the Severity scale. |

#### Debate

| Field | Label | Meaning |
| --- | --- | --- |
| `debate_role` | Debate Role | The stance the expert takes in a structured debate (e.g. proponent, skeptic, synthesizer). |
| `rebuttal_style` | Rebuttal Style | How the expert argues against opposing positions. |

### System fields (read-only)
Managed by the platform; shown when you read a profile.

| Field | Meaning |
| --- | --- |
| `id` | Stable unique identifier (used by get_sme, clone_sme, etc.). |
| `status` | Lifecycle state: active (visible), deprecated (kept, down-ranked), or archived (hidden but recoverable). |
| `visibility` | workspace (private to your workspace) or library (in the shared public library). |
| `source` | How the SME came to exist: user, generated, cloned, promoted, or imported. |
| `current_version` | Monotonic version number; every update snapshots the prior state into history. |
| `cloned_from_id` | If cloned or promoted, the id of the SME it descends from (lineage). |
| `usage_count` | How many times the SME has been consulted — a popularity signal. |
| `quality_score` | Derived 0–100 quality from feedback. See the Quality score scale. |
| `created_at / updated_at` | Timestamps for creation and last modification. |

## Value scales
What the constrained fields' values mean.

### Expertise level `expertise_level`
_ordered enum._

| Value | Meaning |
| --- | --- |
| `Junior` | Early-career; competent on well-scoped tasks, needs oversight on ambiguous ones. |
| `Mid-level` | Independent on most day-to-day work in the discipline. |
| `Senior` | Deep, reliable judgment; sets direction on hard problems. |
| `Expert` | Recognized authority; trusted on the discipline’s frontier. |
| `Principal` | Field-shaping; the person others in the discipline defer to. |

### Role type `role_type`
_enum._

| Value | Meaning |
| --- | --- |
| `sme` | Subject-matter expert — the default; reasons in-domain and gives assessments. |
| `challenger` | Devil’s advocate — exists to attack the prevailing view and expose weak assumptions. |
| `moderator` | Neutral facilitator — structures a multi-expert debate rather than taking a side. |

### Vectors `vectors`
_four scores, each 0–100._ How strongly this expert’s lens is oriented toward each dimension. 0 = not their lens at all, 100 = this is the axis they see everything through. They do not sum to 100 — an expert can be high on several.

| Value | Meaning |
| --- | --- |
| `human` | People and social factors: insiders, human intelligence, motivation, deception, organizational behavior. |
| `technical` | Technical and cyber factors: software, hardware, networks, engineering, exploitation. |
| `physical` | Physical and material factors: kinetic effects, facilities, logistics, supply chain, geography. |
| `futures` | Emerging and long-range factors: novel threats, second-order effects, strategic warning, horizon scanning. |

### Severity `severity`
_ordered enum._

| Value | Meaning |
| --- | --- |
| `CRITICAL` | Catastrophic if realized; demands immediate action. |
| `HIGH` | Serious; prioritize. |
| `MEDIUM` | Material but bounded. |
| `LOW` | Minor; track. |
| `INFO` | Contextual only; no action implied. |

### Weighting adjustment `weighting_adjustment`
_multiplier._ How much to trust this expert’s severity calls relative to peers. 1 = neutral (default), >1 amplifies their weight, <1 dampens it. Used when fusing several experts’ assessments.

### Quality score `quality_score`
_number 0–100 (derived)._ A smoothed rolling average of session feedback (record_feedback). Drives search ranking and library-promotion eligibility. Not user-set.

## Extensions (domain packs)
`extensions` holds optional namespaced packs so specialists carry extra fields without bloating
the core schema. The built-in example is `red_team`:

| red_team field | Meaning |
| --- | --- |
| `focus` | What the red-team lens concentrates on for this expert. |
| `adversary_model` | The adversary this expert reasons against — capabilities and intent. |
| `severity_default` | Default severity for this expert's findings (see the Severity scale). |
| `weighting_adjustment` | Relative weight for this expert's severity calls (see the Weighting adjustment scale). |

Packs are free-form: any object under a namespace is stored and displayed. Add your own (e.g.
`clinical`, `legal`) for vertical fields.

## Curation & quality
Every SME is **versioned** — updates snapshot the prior state, so changes are reversible.
`quality_score` is a smoothed rolling average of `record_feedback` (0–100) and drives search
ranking and promotion eligibility. To share a private SME, `propose_promotion` runs automated gates
(usage, quality, duplication) and, if they pass, queues it for an **admin** to approve in the
library console. Admins can also edit, deprecate, archive, or delete library entries and manage
other admins from the account page.

## Self-hosting
The stack is Next.js on Vercel + Supabase (Postgres, Auth, pgvector). Clone the repo, apply the SQL
migrations (or `supabase/apply-latest.sql`), set `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_EMAILS`, then deploy. See `README.md` and `docs/` for the
full setup.
