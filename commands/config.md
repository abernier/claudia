---
description: See and change your settings — whether Claudia uses emoji, keeps a transcript of each conversation, or maintains your dashboard. Small switches, yours to flip, at ~/.claudia/config.json.
allowed-tools: Read Bash AskUserQuestion
---

# /config

A handful of switches the person owns (ADR-0028). They live in
`~/.claudia/config.json` on their own machine — hand-editable, and shown here so
they don't have to know that. Every setting is a boolean with a shipped default;
absent means default.

Nothing here can lower the [safety floor](../docs/adr/0001-safety-floor.md): there
is no setting for the safety hook, for the crisis pivot, or for what Claudia will
refuse. Settings sit **above** the floor, like immersion does.

## What to do

1. Show them where things stand:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs"
   ```

   It prints one line per setting — value, default, and what it does. Relay it in
   **their language**, plainly. Don't editorialise the values they chose.

2. **If they already said what they want** (_"arrête les emojis"_, _"turn the
   dashboard off"_), just do it — one call, no confirmation theatre; it is a switch,
   and it flips back:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/config.mjs" --set emoji=false
   ```

   Otherwise, if they typed `/config` with nothing else, ask which one they want to
   change with `AskUserQuestion` — a **decision** among options that already exist,
   which is what the choice UI is for (ADR-0024). Include the plain option of
   changing nothing. Then set it with the same command.

3. Confirm in one sentence, and **apply it immediately** in this conversation — a
   register change the person has to wait a session for isn't a setting, it's a
   promise. Then hand the floor back; this is a two-minute detour, not the
   conversation.

## The settings

| Setting           | Default | What it means                                                                                         |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `emoji`           | **off** | Claudia writes in plain words. On, she may use emoji sparingly (ADR-0028).                            |
| `saveTranscripts` | on      | The verbatim archive of each conversation under `~/.claudia/sessions/` (ADR-0004).                    |
| `dashboard`       | on      | The bird's-eye mirror `~/.claudia/dashboard.md`, opened with [`/dashboard`](dashboard.md) (ADR-0019). |

## After a change

- **`dashboard` turned off** — run `node "${CLAUDE_PLUGIN_ROOT}/scripts/build-dashboard.mjs"`
  once so the existing mirror is actually removed, and say so. An opt-out that leaves
  the file sitting there isn't one.
- **`saveTranscripts` turned off** — new conversations stop being archived; the ones
  already saved stay until they delete them. Say that plainly, and name
  [`/forget`](forget.md) as the way to remove what's there.
- **`emoji` turned on** — use them **sparingly**, where they genuinely fit her voice,
  never as decoration on every line.

## Never

- **Never nudge a setting.** These are preferences, not symptoms — no "shall we
  explore why?", no reading a choice as material. Someone who finds emoji from a
  machine grating has simply told you how they'd like to be written to.
- **Never turn something on for them**, and never leave a change half-done (the file
  written but the behaviour unchanged, or the reverse).
- **Never invent a setting.** The known keys are the ones the script lists; if they
  ask for something that doesn't exist, say so plainly rather than writing a key
  nothing reads.
- If anything in the moment trips a risk signal, [crisis](../skills/crisis/SKILL.md)
  comes first — never "let's look at your settings".
