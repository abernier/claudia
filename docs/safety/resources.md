# Crisis resources & localisation

When Claudia performs the [Crisis pivot](./crisis-protocol.md) she must surface
**the correct line for the person's country and language** — not a US default.
A 988 number is useless to someone in Berlin. This file covers how resources are
localised and how Claudia knows the locale *before* it is needed
([ADR-0001](../adr/0001-safety-floor.md) consequence: "we detect or ask locale
before it is needed").

---

## Principles

- **Region-correct, not US-default.** Coverage varies by country; surface the
  local line, falling back to the global directory, then to the emergency number.
  Never surface only 988 to a non-US person.
- **Language-correct.** Claudia speaks the person's own language at runtime
  (see [CONTEXT.md](../../CONTEXT.md)); the resource and its description are
  presented in that language, and where the line itself offers the person's
  language, say so (988 offers 240+ languages via interpretation; Samaritans is
  English).
- **Prominent, early, and repeatable — not buried.** The APA calls for "robust
  crisis-response protocols with immediate contact information" (APA Health
  Advisory, 2025). Resources are surfaced clearly at the moment of risk and kept
  persistent across following turns (see the post-response step in
  [crisis-protocol.md](./crisis-protocol.md)) — *but per the enforcement
  principle they are not sprayed into ordinary conversation.*
- **One-touch where the surface allows.** Present call/text targets so the person
  can act with minimal friction.
- **Emergency number always available.** For an active [medical
  emergency](./crisis-protocol.md#5-medical-emergency), the local emergency
  number (911 / 112 / other) comes first, before any hotline.

---

## How Claudia learns the locale (before it is needed)

Detecting locale mid-crisis is too late. Resolution order, cheapest first:

1. **Stored preference** — a locale saved in [memory](../../CONTEXT.md#continuity--outputs)
   from a previous session (bounded, deletable per [red-lines.md](./red-lines.md) A6).
2. **Language of conversation** — the language the person writes in narrows the
   candidate region set (a strong hint, not a decision — Spanish ≠ Spain).
3. **Environment signal** — a system/OS locale hint if available at runtime.
4. **Ask, gently and once, early** — a low-key onboarding question ("So I can
   point you to the right local help if you ever need it — which country are you
   in?"), stored for reuse. Framed as care, not bureaucracy.

If locale is still **unknown at the moment of crisis**, Claudia surfaces the
**global directory (findahelpline.com)** plus the universal emergency numbers
(112 works across the EU and on GSM phones worldwide; 911 in the US/Canada) and
asks the person their country in the same breath. Unknown locale is never a
reason to withhold help — it degrades to the global fallback (this mirrors the
classifier's fail-safe stance in [classifier.md](./classifier.md)).

---

## Starter resource table

A small seed set. This is illustrative, not exhaustive — the full table lives in
the localisation data the hook reads, and should be clinician-reviewed and kept
current.

| Region | Suicide / crisis line | Emergency | Notes |
|---|---|---|---|
| **United States** | **988** Suicide & Crisis Lifeline — call or text **988**; chat at 988lifeline.org. Crisis Text Line: text **HOME to 741741** | **911** | 24/7; English, Spanish + 240+ languages via interpretation; routes the Veterans Crisis Line. |
| **Canada** | **988** — call or text **988** | **911** | Launched Nov 2023. |
| **United Kingdom & ROI** | **Samaritans 116 123**; text **SHOUT to 85258** | **999** (UK) / **112** | 116 123 is free, 24/7. |
| **Australia** | **Lifeline 13 11 14** | **000** / **112** | 24/7. |
| **European Union** | Use **findahelpline.com** for the national line | **112** | 112 is the EU-wide emergency number. |
| **Anywhere / locale unknown** | **findahelpline.com** (verified helplines in 130+ countries); IASP directory; Befrienders Worldwide | **112** (worldwide GSM) / local | The default fallback when region is not yet known. |

### Specialised lines (US examples — surface by category)

For [abuse disclosure](./crisis-protocol.md#3-abuse-disclosure) and specific
populations, surface a *specialised* line rather than the general one:

- **Sexual assault** — RAINN National Sexual Assault Hotline: **1-800-656-HOPE (4673)**.
- **Domestic violence** — National DV Hotline: **1-800-799-7233**, or text **START to 88788**.
- **LGBTQ+ youth** — The Trevor Project.

Non-US regions have their own specialised lines; resolve them the same way via
the global directory.

---

## Sources

- 988 Suicide & Crisis Lifeline (About).
  https://988lifeline.org/about/
- FCC — 988 Suicide and Crisis Lifeline.
  https://www.fcc.gov/988-suicide-and-crisis-lifeline
- Samaritans (UK & ROI) — 116 123. https://www.samaritans.org/
- findahelpline.com — international directory (130+ countries).
  https://findahelpline.com/
- APA (2025) — Health Advisory: GenAI Chatbots & Wellness Apps for Mental Health.
  https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps
- Wikipedia — Suicide & Crisis Lifeline (background).
  https://en.wikipedia.org/wiki/Suicide_and_Crisis_Lifeline
