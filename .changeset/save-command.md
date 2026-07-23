---
"claudia": minor
---

Add `/save` — a person-pulled command to checkpoint working memory mid-session. It distills where the conversation got to and refreshes the working notes (person/goals/themes) plus the dashboard, without waiting for the session to close, filling the discoverability/reassurance gap left by deferred distillation (ADR-0016). It checkpoints the distilled memory, not the verbatim transcript (still the `SessionEnd` hook's job). Amends ADR-0003's command surface (now seven commands).
