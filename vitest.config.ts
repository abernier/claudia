import { configDefaults, defineConfig } from "vitest/config";

// Keep discovery to the project's own suite: agent worktrees under .claude/
// carry stale copies of it, and site/ & demo/ ship nowhere.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, ".claude/**", "site/**", "demo/**"],
  },
});
