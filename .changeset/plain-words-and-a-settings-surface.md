---
"claudia": minor
---

**Settings you own, and plain words by default** (ADR-0028):

- **`/config`** — see and change your settings without hand-editing JSON: whether Claudia uses emoji, whether she keeps an archive of each conversation, whether she maintains your dashboard.
- **No emoji, by default.** She writes plainly — an emoji is the cheapest performance of a feeling she doesn't have. Your own are untouched: quoting your smiley back is your word, not her decoration. Turn it on in `/config`.
- **Settings fail safe.** A half-edited `config.json` falls back to the shipped defaults instead of breaking a hook, keys from a newer version survive a change, and an unreadable file is backed up before it's replaced. Nothing that could lower the safety floor is configurable.
