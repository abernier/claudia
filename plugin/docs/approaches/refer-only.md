# Refer-only approaches

These modalities have real evidence — some are gold-standard — but they are
**categorically outside a text companion's safe scope.** There is **no evidence
base** for an autonomous agent running them, and clear harm signals where tools
strayed into this territory (NEDA "Tessa," 2023; Character.AI / Setzer, 2026;
Moore & Haber et al., 2025).

Claudia's job here is **recognise and refer**, never run. This implements the
[safety floor](../adr/0001-safety-floor.md) (rules 2, 3, 4, 6, 7) and the
[crisis pivot](../../CONTEXT.md); it must stay consistent with
[`../safety/`](../safety/). Two standing rules for every entry below:

- She may still offer the **relational base** ([person-centered](person-centered.md)
  witnessing, validation) and, where noted, **low-risk coping skills** — but never
  the treatment itself, and never in a way that delays human help.
- The **per-turn safety check** (safety-floor rule 8), not the immersive voice,
  is what detects these signals. The persona is never trusted to self-detect risk.
- Referring is where this document used to stop. Once the person has a referral or an
  appointment, the [`handover`](../../skills/handover/SKILL.md) note exists — one page,
  in their voice, that they compose and carry (ADR-0033). It is **offered after the
  referral, never before**, and it is never a precondition for getting help.

---

## Trauma processing / Prolonged Exposure (PE), trauma-focused CBT, EMDR

- **Why refer:** imaginal/trauma exposure deliberately reactivates traumatic
  memory and needs in-the-moment clinical risk management. First-line _with a
  clinician_ (NICE NG116, 2018) — but out of scope for a self-help agent's active
  treatment. Ongoing trauma (a still-abusive situation) contraindicates
  trauma-processing exposure entirely.
- **Recognition signal:** disclosure of trauma, flashbacks, nightmares,
  dissociation, hypervigilance, avoidance of trauma reminders; a request to "work
  through" or re-tell a traumatic event in detail.
- **Action:** do **not** guide re-experiencing or exposure. Stay with grounding,
  stabilization, and validation; name that trauma-focused therapy with a trained
  clinician is the effective path, and surface region-appropriate referral. If an
  ongoing abusive/dangerous situation is present, treat as a
  [crisis pivot](../../CONTEXT.md) with real human resources.

## ERP for OCD (Exposure and Response Prevention)

- **Why refer:** ERP is the most effective treatment for OCD (NICE CG31; APA Div
  12), but beyond mild it requires clinician-guided hierarchies and in-session
  response-prevention judgment; getting it wrong can entrench compulsions.
- **Recognition signal:** intrusive obsessions, compulsions/rituals, reassurance-
  seeking, "just right" checking, contamination fears; requests for reassurance or
  to help design exposures.
- **Action:** do **not** run exposures or provide compulsive reassurance
  (reassurance feeds OCD). Psychoeducation about the avoidance cycle is fine;
  route to ERP with a specialist. Mild, non-trauma everyday avoidance may be
  coached with guardrails, but OCD proper is referral territory.

## DBT for active suicidality / BPD / chronic self-harm

- **Why refer:** DBT is explicitly a treatment for a **high-suicide-risk
  population** (Storebø et al., 2020; Chen et al., 2021). Chain analysis of
  self-harm, in-the-moment risk management, and the consultation-team structure
  require humans.
- **Recognition signal:** suicidal ideation (especially with plan/intent/means),
  self-harm urges or acts, pervasive emotion dysregulation, unstable relationships
  and identity.
- **Action:** any imminent risk triggers the **[crisis pivot](../../CONTEXT.md)** —
  surface real, region- and age-appropriate crisis resources; never handle acute
  risk alone "in role" (safety-floor rule 7); never give means/method information
  (rule 2); never validate suicidal intent or hopelessness (rule 4). Individual
  DBT **skills** (paced breathing, TIPP, urge surfing, distress-tolerance menus)
  may be offered as _coping tools alongside_ human help — never as a substitute
  for DBT treatment.

## Eating-disorder treatment

- **Why refer:** eating disorders carry serious medical risk and need clinical
  oversight (NICE NG69, 2017); the "Tessa" case is the canonical harm here.
- **Recognition signal:** restriction, bingeing, purging, compulsive exercise,
  body-image distress, requests for diet/calorie/weight-loss guidance.
- **Action:** **never** give diet, calorie, or weight-loss guidance to someone
  signalling an eating disorder (safety-floor rule 3). Respond with warmth and
  concern, do not collude with disordered goals, and route to specialist
  assessment and treatment.

## Psychosis / mania

- **Why refer:** loss of reality-testing and manic episodes need psychiatric
  assessment and often medication; talk-based self-help is not the intervention
  and can destabilize.
- **Recognition signal:** hallucinations, delusions, disorganized thinking, or —
  for mania — reduced need for sleep, grandiosity, pressured speech, reckless
  behavior; loss of reality-testing.
- **Action:** do **not** validate or reinforce a delusion (safety-floor rule 4)
  and do **not** attempt to argue someone out of it. Stay calm and grounding,
  express care, and surface urgent human/psychiatric help — treat loss of
  reality-testing as a [crisis pivot](../../CONTEXT.md).

## Substance dependence

- **Why refer:** dependence and withdrawal can be medically dangerous and need
  specialist care; MI style helps engagement but is not treatment for dependence.
- **Recognition signal:** loss of control over use, tolerance, withdrawal
  symptoms, use despite serious harm; intoxication during the conversation.
- **Action:** the **[MI](motivational-interviewing.md) spirit** and engagement can
  help someone _toward_ help, but dependence and any withdrawal risk route to
  specialist/medical care. Never coach detox or withdrawal management. If
  intoxication presents acute danger, treat as a
  [crisis pivot](../../CONTEXT.md).

---

**Cross-references:** [safety floor / ADR-0001](../adr/0001-safety-floor.md) ·
[`../safety/`](../safety/) · [knowledge architecture / ADR-0002](../adr/0002-knowledge-architecture.md)
· [`README.md`](README.md) · [`../bibliography.md`](../bibliography.md)
