---
"claudia": patch
---

**Installing Claudia no longer copies the workshop along with it.** The plugin was
published from the repository root, so an install brought down the landing site, the
demo recordings, the test suite — and a `package.json` the installer then ran
`npm install` against, landing about 100 MB of development tooling on your machine.
It also tripped a compression heuristic on the demo recording, so the install warned
you about a security risk that was never there.

The payload now lives in its own directory and is 785 KB: the persona, the skills, the
commands, the hooks, the safety material and their tests, and nothing else. Your notes
are untouched, nothing changes in a conversation, and `claude plugin update
claudia@claudia` picks this up like any other release.
