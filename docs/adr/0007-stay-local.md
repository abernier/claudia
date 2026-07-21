---
status: accepted
---

# Claudia stays a local plugin — no remote MCP / connector

We considered publishing Claudia as a **remote MCP server / claude.ai connector**
to reach everyone. We chose to **stay a local Claude Code plugin**. The two safety
and privacy pillars do not survive the move:

- The **deterministic per-turn safety hook** (ADR-0001 rule 8) has no equivalent
  in MCP — a server cannot *force* a per-turn safety check on the host, so safety
  would fall back to "the persona is asked to call a tool", exactly the
  trust-the-character failure the floor forbids.
- **Local-only `~/.claudia/`** (ADR-0004) would become **server-side storage of
  GDPR Article 9 special-category mental-health data at scale**, with crisis
  liability, minor-gating, and Illinois / Nevada / EU-AI-Act exposure. Local keeps
  the "your data, your machine" promise real.

## Considered options

- **Remote MCP server** (a "Claudia" prompt + `crisis_resources` / `teach` /
  `exercise` tools) on Vercel, published as a custom connector — **rejected** for
  the reasons above.

## Consequences

- Reach is limited to people who install the plugin. This is an **accepted cost**:
  a smaller, safer footprint over a wider, riskier one.
- If a connector is ever revisited, two problems must be solved *first*: a
  mandatory tool-gate (or hosted moderation) to replace the per-turn hook, and an
  explicit consent + retention model for any server-side data.
