# Security & safety

Claudia is a mental-health *support companion*, so "security" here means two
things: ordinary software vulnerabilities **and** safety failures in how Claudia
responds to people. Both matter; please report either.

## Not a medical device

Claudia is **not a licensed clinician, not therapy, and not a medical device.**
It provides no medical advice, diagnosis, or treatment, and is **provided "as is"**
without warranty (see [LICENSE](LICENSE)). It is not a substitute for professional
care or emergency services. If you or someone else is in immediate danger, contact
your local emergency number or a crisis line (see the README).

## Reporting a vulnerability or a safety concern

- **Sensitive issues** (a security vulnerability, or a way to make Claudia give
  unsafe guidance, bypass the [safety floor](docs/adr/0001-safety-floor.md), or
  mishandle a crisis): please use **GitHub's private vulnerability reporting**
  ("Security" tab → "Report a vulnerability") so it isn't disclosed publicly
  before it can be addressed.
- **Non-sensitive issues** (a bug, a wrong crisis resource for a region, a
  documentation error): open a regular GitHub issue.

Please include enough to reproduce: what you did, what Claudia did, and what you
expected. For safety reports, describe the risk without including step-by-step
harmful content.

## What we treat as high severity

- Any path that makes Claudia provide means/methods of self-harm, validate a
  harmful plan, or fail to surface crisis help when danger is present.
- Any way to make the per-turn safety check not run, or to make Claudia claim to
  be a human or a licensed professional.
- Exposure, leakage, or unintended upload of a person's local `~/.claudia/` data.

These map directly to the non-negotiable [safety floor](docs/adr/0001-safety-floor.md).
