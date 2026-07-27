# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Notes for this repo

Only `wontfix` exists on the repo today — it is one of GitHub's default labels. The other four are created on first use: `gh issue edit --add-label` fails on a label that doesn't exist yet, so create it first with `gh label create <name> --description "..."`.

These labels are orthogonal to the `wayfinder:*` labels (`map`, `research`, `prototype`, `grilling`, `task`), which mark the _kind_ of work rather than the triage state. An issue can carry one of each.
