#!/usr/bin/env bash
#
# Live-development link. Symlinks this repo into ~/.claude/skills so Claude Code
# loads it in place as `claudia@skills-dir` — edits to the repo take effect with
# no reinstall. Removes any packaged install of a plugin *named* claudia first:
# a cached copy shadows the link and duplicates its hooks.
#
# Usage:  npm run link      (then restart Claude Code, or /reload-plugins)
#
# `npm install` runs it too (the `prepare` script), so a fresh clone is linked
# without a second command. It is idempotent, and it repoints an existing link:
# whichever tree you last installed in — repo or worktree — is the live one.
#
# `npm run link`, not `npm link` — the latter is npm's own global-symlink command
# and has nothing to do with this.
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

# Hanging this off `npm install` means it also runs where there is no Claude Code
# to link into. A runner has nothing to hot-reload, so linking there would write
# to a throwaway $HOME and prove nothing.
if [ -n "${CI:-}" ]; then
  echo "· CI — skipping the dev link."
  exit 0
fi

# Every packaged install of a plugin named `claudia` competes with the link,
# whatever marketplace it came from and whatever scope it sits in — so enumerate
# them rather than hardcoding `claudia@claudia`. Prints `id<TAB>scope` per line;
# silent when the registry is absent (nothing installed yet) or unreadable.
conflicts() {
  node -e '
    const fs = require("node:fs")
    let db
    try {
      db = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
    } catch {
      process.exit(0)
    }
    for (const [id, installs] of Object.entries(db.plugins ?? {}))
      if (id.split("@")[0] === "claudia")
        for (const i of installs) console.log(`${id}\t${i.scope ?? "user"}`)
  ' "$CLAUDE_DIR/plugins/installed_plugins.json"
}

while IFS=$'\t' read -r id scope; do
  [ -n "$id" ] || continue
  echo "• $id ($scope) is installed as a packaged plugin and would shadow the link — uninstalling."
  claude plugin uninstall "$id" --scope "$scope" --yes >/dev/null 2>&1 || true
done < <(conflicts)

LINK="$CLAUDE_DIR/skills/claudia"

# A real directory at that path — an install copied in by hand rather than
# linked — is the third way to end up with two claudias, and the quietest:
# `ln -sfn` onto an existing directory links *into* it, so the copy stays loaded
# and the link goes nowhere. Deleting a directory in someone's $HOME is not this
# script's call; name it and stop.
if [ -e "$LINK" ] && [ ! -L "$LINK" ]; then
  echo "✘ $LINK exists and is not a symlink — a copied install, shadowing this repo." >&2
  echo "  Remove it (rm -rf \"$LINK\"), then re-run." >&2
  exit 1
fi

mkdir -p "$CLAUDE_DIR/skills"
ln -sfn "$REPO/plugin" "$LINK"

# Assert the state we just claimed, rather than assuming the commands took: the
# link must point here *and* resolve to a manifest, or it loads nothing.
[ "$(readlink "$LINK")" = "$REPO/plugin" ] && [ -f "$LINK/.claude-plugin/plugin.json" ] || {
  echo "✘ $LINK does not resolve to $REPO/plugin/.claude-plugin/plugin.json" >&2
  exit 1
}

echo "✔ Linked claudia@skills-dir -> $REPO/plugin"
echo "  Edits are now live. Apply them with /reload-plugins (context) or a restart (hooks)."
echo "  Revert with: npm run unlink"

# Anything still installed survived its own uninstall — say so instead of
# leaving two claudias loaded and the confusion that follows.
remaining="$(conflicts | cut -f1 | tr '\n' ' ')"
[ -z "$remaining" ] || {
  echo "⚠ Still installed after the uninstall: ${remaining% }" >&2
  echo "  That copy shadows the link. Remove it by hand: claude plugin uninstall <id> --scope <scope>" >&2
}

# A project-scope skill of the same name loads *on top of* the user-scope link
# whenever Claude Code runs from this repo — same duplication, different source.
[ ! -e "$REPO/.claude/skills/claudia" ] || {
  echo "⚠ $REPO/.claude/skills/claudia also defines claudia (project scope) — remove it to avoid a duplicate." >&2
}
