# psychotherapy

The reference domain, and the first entry the registry would index. What it declares
is described at principle level in
[`docs/composable-domains.md`](../../docs/composable-domains.md); this file is the
package's own index of it.

**Nothing here is loaded by a declaration yet.** The plugin ships exactly one domain and
always declares it, so `.claude-plugin/plugin.json` points at these directories directly
and `hooks/hooks.json` still wires this domain's lifecycle scripts by name. The
declaration, the compose gate and the domain set are model, not code. What the move
buys today is that the line is **visible and enforced** — see the `chassis holds no
domain content` tests in `tests/structure.test.ts`.

## soul

[`SOUL.md`](SOUL.md) — one prose document, worn while this domain is active.
"Claudia" is the name of this soul, not of the assembly. Audited by nothing,
subordinate to nothing; its only structured fact is that it exists.

## floor

Prose authority: [`docs/safety/red-lines.md`](docs/safety/red-lines.md) (N1–N9 / A1–A7,
each citing ADR-0001's ten rules). Machine-readable form of the one **site-1** rule:
[`docs/safety/floor.json`](docs/safety/floor.json), read by the chassis's per-turn check.

Nine rules are declared. `F8` is not — it _is_ the mechanism, and the mechanism is the
chassis's. Exactly one rule binds at site 1 (detection → hand-off); the rest bind at
site 2, borne by the practice, and two bind at site 3, over this domain's own machinery.

`A6` currently declares a deletion half with no command implementing it
([ADR-0034](../../docs/adr/0034-remove-forget.md)). Stated, not narrowed.

## escalation map

[`docs/approaches/refer-only.md`](docs/approaches/refer-only.md) — territory → real
profession. Every target is a human profession: composing never discharges an
escalation, because a domain is a library, not a credential.

## library

[`docs/approaches/`](docs/approaches/) (eight usable modalities + the refer-only list),
[`docs/competencies/`](docs/competencies/), [`docs/qualities/`](docs/qualities/),
[`docs/safety/`](docs/safety/) (crisis protocol, resources, classifier spec),
[`docs/bibliography.md`](docs/bibliography.md),
[`docs/person-fiche-template.md`](docs/person-fiche-template.md).

## commands — seven

`/dashboard` · `/export` · `/help-now` · `/keep` · `/menu` · `/save` · `/thread`

They act on the **content**, in categories this domain defines. The chassis keeps three
that act on the **store**: `/backup`, `/config`, `/migrate`.

## skills — nineteen

In [`skills/`](skills/). The persona, recall and distillation, the crisis conduct, the
approach chooser, and the note-writing skills for every record kind below.

## record kinds

The whole vault vocabulary is this domain's, and it is described in
[`docs/memory-layout.md`](docs/memory-layout.md): `MEMORY.md`, `person.md`, `goals.md`,
`todo.md`, `keepsakes.md`, `understanding.md`, `people.md` + `people/`, `timeline.md`,
`themes.md` + `themes/`, `safety.md`, `dashboard.md`, `sessions/` (summaries,
transcripts, assets, pending flags), `teachings/`, `exercises/`, `handovers/`.

The domain **defines** them, the chassis **stores** them, the person **owns** them.
Nothing requires a domain to have a note system at all — this one does.

## code

[`src/dashboard.mjs`](src/dashboard.mjs) and
[`scripts/build-dashboard.mjs`](scripts/build-dashboard.mjs) — the mirror knows this
domain's record kinds, their order and their labels, which is why it is here and not in
the chassis. [`scripts/vault-export.mjs`](scripts/vault-export.mjs) backs `/export`.

## hooks onto the three moments

| moment        | what this domain does                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| **open**      | `recall` reads the working layer; `distill-session` clears the flag left by the last close                   |
| **each turn** | supplies `floor.json`'s criteria to the chassis's check, and its conduct as the payload an interrupt carries |
| **close**     | the verbatim transcript, the pending flag, deferred distillation, the dashboard rebuild                      |

Their scripts still live under the chassis's `scripts/` and are wired by name in
`hooks/hooks.json`. Moving them behind a declared dispatch is the next step, and it is
deliberately **not** bundled with this move: the same hook event carries the per-turn
safety check, and two structural changes at once on that path is not a trade worth
making.
