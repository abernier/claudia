# Claudia

A warm, immersive, **generalist** therapist companion — as an installable Claude
Code plugin. Claudia draws on evidence-based psychotherapy (person-centered, CBT,
behavioral activation, ACT, motivational interviewing, solution-focused,
mindfulness & self-compassion) and adapts to the person in front of her.

> **Claudia is not a licensed clinician and never claims to be one.** She is a
> companion for reflection and support, not a substitute for professional care or
> emergency services. She rests on a non-negotiable [safety floor](docs/adr/0001-safety-floor.md).

## What makes Claudia different

- **Relationship first.** The evidence says the therapeutic bond drives outcomes
  more than any technique (Wampold, 2015). Claudia's always-on core is
  relational — empathy, positive regard, alliance — and the modalities are a
  toolbox she reaches into when indicated. See [ADR-0002](docs/adr/0002-knowledge-architecture.md).
- **Immersion with a floor.** Warm and in-character by default — no infantilising
  disclaimers — but a deterministic safety layer runs on every turn and a
  [crisis pivot](docs/safety/) surfaces real human help when danger is detected.
- **Natural-language first.** Only three slash commands exist (all
  system/safety/privacy actions). Everything therapeutic happens in ordinary
  conversation. See [ADR-0003](docs/adr/0003-plugin-runtime-shape.md).
- **Your data, your machine.** Memory lives under `~/.claudia/` on your own
  computer. Nothing is uploaded. See [ADR-0004](docs/adr/0004-memory-model.md).
- **Speaks your language.** The codebase is English; Claudia speaks *your*
  language and writes her deliverables in it. See [ADR-0005](docs/adr/0005-language-policy.md).

## Commands

Claudia deliberately ships only three commands — the rest is conversation:

| Command | What it does |
|---|---|
| `/help-now` | Immediately surface crisis resources for your region. |
| `/forget` | Really delete a memory, a session, or everything. |
| `/export` | Export your memory and deliverables. |

## Install

```
claude plugin marketplace add abernier/claudia
claude plugin install claudia@claudia
```

Then just start talking. Validate a local checkout with:

```
claude plugin validate . --strict
```

## Repository layout

```
.claude-plugin/   plugin.json + marketplace.json (manifests)
SOUL.md           who Claudia is (loaded by the persona skill)
CONTEXT.md        the project glossary
docs/
  adr/            the decisions and why
  qualities/      how Claudia is (empathy, positive regard, congruence)
  competencies/   what Claudia does (microskills, alliance, rupture-repair)
  approaches/     the modality library (loaded just-in-time) + refer-only list
  safety/         crisis protocol, C-SSRS logic, localized resources, classifier
  bibliography.md the evidence base
skills/           Claudia's capabilities
commands/         the three commands
hooks/            the per-turn safety hook + session-save hook
```

## Safety

If you or someone else is in immediate danger, contact your local emergency
number (112 in the EU, 911 in the US/Canada) or a crisis line (988 in the
US/Canada; Samaritans 116 123 in the UK; find your country at
<https://findahelpline.com>). Claudia is not an emergency service.
