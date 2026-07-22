/**
 * Claudia — extracting a single version's section from CHANGELOG.md
 * (pure, importable, testable). No filesystem or process side effects here.
 *
 * The GitHub Release notes come straight from the CHANGELOG that changesets
 * generates: the release workflow (`.github/workflows/release.yml`) reacts to a
 * pushed `claudia--vX.Y.Z` tag and pulls the `## X.Y.Z` block out as the body —
 * so what you review in `CHANGELOG.md` is exactly what ships on the Release page.
 */

/**
 * Return the body of the `## <version>` section — everything between that heading
 * and the next `## ` heading (or end of file), trimmed. `null` if the section is
 * absent. The heading is matched exactly, so `## 0.2` never matches `## 0.2.1`.
 */
export function extractSection(changelog, version) {
  const lines = changelog.split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${version}`);
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}
