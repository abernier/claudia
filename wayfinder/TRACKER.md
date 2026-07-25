# Local-markdown tracker

This repo has no external issue tracker configured for wayfinding; the map and
its tickets live here as plain Markdown, uncommitted until Antoine commits them.

## Wayfinding operations

- **The map** is [`map.md`](map.md) (frontmatter `label: wayfinder:map`) — the
  canonical artifact, an index, loaded once per session.
- **Tickets** are `tickets/NNN-slug.md`, children of the map. Frontmatter:

  ```yaml
  id: 3 # the ticket's identity, referenced by blocked-by
  title: … # the name — always refer to a ticket by this, never by id alone
  type: wayfinder:grilling # or wayfinder:research | wayfinder:prototype | wayfinder:task
  status: open # or closed
  assignee: # empty = unclaimed; set it BEFORE any work (the claim)
  blocked-by: [] # list of ids; body convention — markdown has no native blocking
  ```

- **Claim**: set `assignee:` to yourself first, before any work. An open,
  unassigned ticket is unclaimed.
- **Frontier** = tickets with `status: open`, empty `assignee:`, and every id in
  `blocked-by:` pointing at a `status: closed` ticket. Rough query:
  `grep -l 'status: open' tickets/*.md | xargs grep -L '^assignee: .'`, then
  check each hit's `blocked-by` by hand.
- **Resolution**: append a `## Resolution` section to the ticket (the answer
  lives there and only there), set `status: closed`, and add one index line to
  the map's _Decisions so far_.
- **Assets** created while resolving a ticket go under `assets/` and are linked
  from the ticket, never pasted in.
