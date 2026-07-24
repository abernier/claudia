---
"claudia": minor
---

**A rotating archive under your notes** (ADR-0032):

- **Your notes now have a second copy.** A snapshot of `~/.claudia/` lands in `~/.claudia-backups/` at each session close and every hour — local only, uploaded nowhere.
- **Kept as a ladder, not a pile.** Everything from the last two days, then one per day, per week, per month, per year — so a mistake you notice weeks late still has an ancestor.
- **It refuses to archive nothing over something.** An empty vault never overwrites real history, and every archive is read back before it counts.
- **`/backup`** — see what's kept, verify it, or restore one into a new folder, never over your live notes.
- **An archive is a record.** `/forget` clears your notes and leaves the archives alone; Claudia never reaches into one to bring back what you chose to forget. Clearing them is yours to ask.
