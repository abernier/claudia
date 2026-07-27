# The approaches library

This directory is Claudia's **just-in-time library of [Approaches](../../CONTEXT.md)**
— one file per recognised school of psychotherapy she can draw on. Per
[ADR-0002](../adr/0002-knowledge-architecture.md), these files are **data loaded
on demand**, never resident in the always-on persona. The persona carries only
the relational spine (empathy, positive regard, congruence, the microskills, the
[therapeutic alliance](../../CONTEXT.md)) plus a pointer to this library.

Every efficacy claim here cites into [`../bibliography.md`](../bibliography.md)
as `(Author, Year)`, and should be read against the publication-bias and
allegiance caveats noted there (Cuijpers et al., 2010).

## How `choose-approach` selects

The `choose-approach` router picks an approach per moment, weighing one question:
**does this person need a specific technique right now, or do they need the
relationship?**

1. **Relationship-first is the default.** The evidence points here: specific
   techniques explain a small share of outcome, while the alliance and common
   factors dominate (Wampold & Imel, 2015; Flückiger et al., 2018), and bona-fide
   therapies are broadly equivalent for most common problems (the "Dodo bird"
   pattern). So the base layer is always [person-centered](person-centered.md)
   reflective listening — warmth, validation, open questions — regardless of what
   technique (if any) rides on top.

2. **The approach leads when a specific technique is indicated.** Relationship-
   first is a default, not a cage (ADR-0002). When the presenting concern has a
   clear specific-technique indication — the sharpest case being _exposure_ for
   anxiety / OCD / PTSD, the one ingredient research shows carries specific benefit
   — the router lets the [Approach](../../CONTEXT.md) take the lead. Note that for
   the highest-risk of these, "leading" means **recognise and refer**, not run
   (see below).

3. **Match intensity to severity.** Low-intensity guided self-help fits
   subclinical-to-mild distress; moderate-to-severe presentations and any acute
   risk route to human care. This is where the digital evidence is strongest and
   where a text companion belongs.

## Usable vs refer-only

The library splits in two, per the [safety floor](../adr/0001-safety-floor.md)
and [`../safety/`](../safety/):

**Usable** — safe for an autonomous text companion to run in chat:

| File                                                             | Approach                                        | One-line role                                   |
| ---------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| [person-centered.md](person-centered.md)                         | Person-Centered / Humanistic                    | The relational base under everything            |
| [cbt.md](cbt.md)                                                 | Cognitive Behavioral Therapy                    | Structured thought/behavior skills              |
| [behavioral-activation.md](behavioral-activation.md)             | Behavioral Activation                           | Highest-value, lowest-risk companion fit        |
| [act.md](act.md)                                                 | Acceptance & Commitment Therapy                 | Defusion, values, acceptance                    |
| [motivational-interviewing.md](motivational-interviewing.md)     | Motivational Interviewing                       | A _style_ for ambivalence and engagement        |
| [solution-focused.md](solution-focused.md)                       | Solution-Focused Brief Therapy                  | Scaling, exceptions, small next steps           |
| [mindfulness-self-compassion.md](mindfulness-self-compassion.md) | Mindfulness & Self-Compassion (MBCT/MBSR + CFT) | Decentering, grounding, soothing self-criticism |

**Refer-only** — [refer-only.md](refer-only.md): high-risk modalities Claudia
must **recognise and refer**, never run autonomously (trauma processing /
Prolonged Exposure, ERP for OCD, DBT for active suicidality/BPD, eating-disorder
treatment, psychosis/mania, substance dependence).

## Selection heuristic

Presenting concern → candidate approach, grounded in the evidence. A _triage
heuristic_, not an assessment; when in doubt, lead with the relationship and
match intensity to severity.

| Presenting concern                                        | Candidate approach                                                                                           | Note                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Wanting to feel heard; ambivalent about "therapy"         | [Person-centered](person-centered.md) stance + [MI](motivational-interviewing.md)                            | Reflective listening is the universal substrate                            |
| Mild–moderate low mood, withdrawal, inertia               | [Behavioral Activation](behavioral-activation.md)                                                            | Best companion fit; concrete, low-interpretation (Richards et al., 2016)   |
| Unhelpful thinking patterns, worry, mild anxiety          | [CBT](cbt.md)                                                                                                | Psychoeducation + thought records; monitor severity (Hofmann et al., 2012) |
| Stuck fighting one's own thoughts/feelings                | [ACT](act.md)                                                                                                | Defusion, acceptance, values (A-Tjak et al., 2015)                         |
| Ambivalence about a habit or change                       | [MI](motivational-interviewing.md)                                                                           | Evoke change talk; dependence → refer (Lundahl et al., 2010)               |
| Wants quick, forward-looking, strengths-based help        | [Solution-Focused](solution-focused.md)                                                                      | Scaling + exceptions + small steps (Gingerich & Peterson, 2013)            |
| Recurrent depression, currently well (relapse prevention) | [MBCT](mindfulness-self-compassion.md)                                                                       | _The_ indication; not for acute episodes (Kuyken et al., 2016)             |
| Stress, burnout, subclinical distress, wellbeing          | [Mindfulness](mindfulness-self-compassion.md) + [BA](behavioral-activation.md) + [SFBT](solution-focused.md) | The companion sweet spot — largest digital effects                         |
| High shame / harsh self-criticism                         | [Self-compassion / CFT](mindfulness-self-compassion.md)                                                      | Good fit; watch for "backdraft" (Millard et al., 2023)                     |
| Anxiety / OCD / PTSD needing exposure                     | **Recognise → [refer](refer-only.md)**                                                                       | Exposure carries specific benefit but is clinician territory beyond mild   |
| Active suicidality / BPD / self-harm                      | **[Refer](refer-only.md)** + crisis pivot                                                                    | DBT skills only as coping; risk → humans                                   |
| Eating-disorder signals                                   | **[Refer](refer-only.md)**                                                                                   | Safety-floor rule 3; never diet/weight guidance                            |
| Psychosis / mania, substance dependence                   | **[Refer](refer-only.md)**                                                                                   | Out of scope; escalate                                                     |

## Digital-agent evidence (why this library is shaped the way it is)

The most decision-relevant literature is on _delivery_, not just modality:

- **Guided beats unguided.** Internet-delivered CBT is the strongest digital
  format, and **guided iCBT outperforms unguided** — even brief human contact is
  the most consistent amplifier of both adherence and outcome (Karyotaki et al.,
  2021; Andrews et al., 2018). Attrition is the Achilles' heel of fully
  autonomous self-help.
- **Chatbot effects are real but modest.** Pooled RCTs put conversational-agent
  effects around **g ≈ 0.3 for depression and anxiety** short-term (He et al.,
  2023), **strongest in subclinical/mild populations** (g ≈ 0.74 in subclinical
  youth), and **often not sustained** — Li et al. (2023) found no significant
  effect at ~3-month follow-up. This argues for framing Claudia as _ongoing
  support_, not a "course of treatment," and for targeting mild/preventive needs.
- **Users do bond with text agents.** People form a measurable
  working-alliance-like bond with a chatbot (Beatty et al., 2022) — which is
  exactly why the relational base matters and can carry real weight.
- **The RCT evidence is on scripted bots, not open LLMs.** Almost all trial
  evidence covers **rule-based / curated-content** chatbots (Woebot, Wysa), not
  open-ended generative models. LLMs add hallucination, inconsistent clinical
  fidelity, and **sycophancy** — validating a belief because it pleases rather
  than because it helps. Documented harms (NEDA "Tessa," 2023; Character.AI /
  Setzer settlements, 2026; Moore & Haber et al., 2025) all came from agents
  straying past their scope. Treat LLM fidelity and safety as **unsolved and
  requiring guardrails**, which is why the [safety floor](../adr/0001-safety-floor.md)
  and the usable/refer-only split are non-negotiable.
