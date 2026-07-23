/**
 * Claudia — time-awareness logic (pure, importable, testable).
 *
 * The hook entrypoint (scripts/time-context.mjs) is a thin wrapper around this.
 * Everything here is side-effect-free and clock-free: the "now" Date and the
 * previous-seen timestamp are passed in, so it unit-tests without a real clock.
 *
 * Why this exists: nothing re-anchored "now" between turns, so a conversation
 * resumed the morning after still believed it was last night (ADR-0012). The hook
 * re-injects an authoritative local time every turn, and classifies the gap since
 * the person last spoke with Claudia so she can wear a real break warmly.
 */

/**
 * Local wall-clock parts for a Date in a given IANA zone.
 *
 * @typedef {object} ZonedParts
 * @property {number} year
 * @property {number} month 1-based calendar month.
 * @property {number} day
 * @property {number} hour Local hour, 0–23.
 * @property {number} minute
 * @property {number} second
 * @property {string} weekday Long English weekday name (e.g. "Wednesday").
 * @property {number} offsetMinutes UTC offset at that instant, in minutes (signed).
 */

/**
 * Local wall-clock parts for a Date in a given IANA zone (pure; Intl-based).
 *
 * @param {Date} date The instant to read.
 * @param {string} timeZone IANA zone name (e.g. "Europe/Paris").
 * @returns {ZonedParts}
 */
export function zonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
  });
  /** @type {Record<string, string>} */
  const p = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") p[part.type] = part.value;
  }
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  const hour = Number(p.hour);
  const minute = Number(p.minute);
  const second = Number(p.second);
  // Offset = (wall-clock read as if it were UTC) − (the actual instant).
  const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = Math.round((asUTC - date.getTime()) / 60000);
  // p.weekday is always present: "weekday" is requested in the formatToParts options.
  return { year, month, day, hour, minute, second, weekday: /** @type {string} */ (p.weekday), offsetMinutes };
}

/** @param {number} n */
const pad = (n) => String(n).padStart(2, "0");

/**
 * The LOCAL calendar day, `YYYY-MM-DD`.
 *
 * This is the granularity every dated field in the vault uses, on purpose: a note
 * records which day it concerns, never the minute it was written. Claudia is exact
 * about the hour *in the moment* and sober about the *record* — a per-minute trace of
 * when someone talked would be surveillance, not presence (ADR-0012).
 *
 * @param {ZonedParts} parts
 * @returns {string}
 */
export function localDay(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * ISO-8601 with LOCAL offset — never UTC "Z", so no conversion step is implied.
 *
 * @param {ZonedParts} parts
 * @returns {string}
 */
export function isoWithOffset(parts) {
  const sign = parts.offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(parts.offsetMinutes);
  const off = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return `${localDay(parts)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${off}`;
}

/**
 * Coarse part-of-day from a LOCAL hour (never derive this from UTC).
 *
 * @param {number} hour Local hour, 0–23.
 * @returns {'night' | 'morning' | 'afternoon' | 'evening'}
 */
export function partOfDay(hour) {
  if (hour >= 22 || hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/**
 * Compact ISO-8601 duration ("PT9H12M"); sub-minute collapses to seconds.
 *
 * @param {number} ms Duration in milliseconds; negatives floor to "PT0S".
 * @returns {string}
 */
export function iso8601Duration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  let out = "PT";
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (!h && !m) out += `${s}S`;
  return out;
}

/**
 * Whole local calendar days between two zoned-parts (now − prev).
 *
 * @param {ZonedParts} prevParts
 * @param {ZonedParts} nowParts
 * @returns {number}
 */
export function daysBetween(prevParts, nowParts) {
  const a = Date.UTC(prevParts.year, prevParts.month - 1, prevParts.day);
  const b = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  return Math.round((b - a) / 86400000);
}

/**
 * How the gap since the previous turn is classified (ADR-0012).
 *
 * @typedef {'first_time' | 'none' | 'same_day' | 'overnight' | 'multi_day'} GapKind
 */

/**
 * Classify the gap since the person last spoke with Claudia.
 *
 * `overnight` follows SLEEP, not the calendar (ADR-0012): the sleep-window clause
 * catches a past-midnight chat (01:30 → 08:00, same date), and a crossed calendar
 * day catches the ordinary case (23:00 → 07:00). The persona names only
 * `overnight` / `multi_day`; `none` / `same_day` stay silent.
 *
 * @param {{ prevMs: number | null, nowMs: number, prevHour: number, nowHour: number, dayDiff: number }} gap
 *   prevMs is the previous-seen epoch ms (null when none); hours are LOCAL; dayDiff comes from daysBetween.
 * @returns {{ since_last: string | null, gap_kind: GapKind }}
 */
export function classifyGap({ prevMs, nowMs, prevHour, nowHour, dayDiff }) {
  if (prevMs == null || !Number.isFinite(prevMs)) {
    return { since_last: null, gap_kind: "first_time" };
  }
  const deltaMs = Math.max(0, nowMs - prevMs);
  const since_last = iso8601Duration(deltaMs);
  const hours = deltaMs / 3_600_000;
  if (hours < 1) return { since_last, gap_kind: "none" };
  if (dayDiff >= 2) return { since_last, gap_kind: "multi_day" };
  const slept = hours >= 4 && hours <= 18 && (prevHour >= 20 || prevHour < 4) && nowHour >= 4 && nowHour < 12;
  if (dayDiff >= 1 || slept) return { since_last, gap_kind: "overnight" };
  return { since_last, gap_kind: "same_day" };
}

/**
 * The full time context for a turn — the object the hook injects.
 *
 * @typedef {object} TimeContext
 * @property {string} now ISO-8601 local time with offset (never UTC "Z").
 * @property {string} zone IANA zone name.
 * @property {string} weekday Long English weekday name.
 * @property {'night' | 'morning' | 'afternoon' | 'evening'} part_of_day
 * @property {string | null} since_last ISO-8601 duration since last spoken; null on first_time.
 * @property {GapKind} gap_kind
 */

/**
 * The full time context for a turn. Pure given (now: Date, prevMs: number|null,
 * timeZone: string). This object is what the hook injects.
 *
 * @param {{ now: Date, prevMs: number | null, timeZone: string }} input
 * @returns {TimeContext}
 */
export function buildTimeContext({ now, prevMs, timeZone }) {
  const nowParts = zonedParts(now, timeZone);
  const base = {
    now: isoWithOffset(nowParts),
    zone: timeZone,
    weekday: nowParts.weekday,
    part_of_day: partOfDay(nowParts.hour),
  };
  if (prevMs == null || !Number.isFinite(prevMs)) {
    return { ...base, since_last: null, gap_kind: "first_time" };
  }
  const prevParts = zonedParts(new Date(prevMs), timeZone);
  const { since_last, gap_kind } = classifyGap({
    prevMs,
    nowMs: now.getTime(),
    prevHour: prevParts.hour,
    nowHour: nowParts.hour,
    dayDiff: daysBetween(prevParts, nowParts),
  });
  return { ...base, since_last, gap_kind };
}

/**
 * The note injected into the turn. Facts only — HOW Claudia wears a gap lives in
 * her persona (skills/claudia/SKILL.md), not here, so this stays persona-neutral.
 *
 * @param {TimeContext} ctx
 * @returns {string}
 */
export function renderTimeContext(ctx) {
  const lead =
    `[CLAUDIA TIME] It is ${ctx.now} (${ctx.zone}) — ${ctx.weekday}, ${ctx.part_of_day}. ` +
    `This is the authoritative "now": trust it over any earlier sense of time in the conversation.`;
  const gap =
    ctx.gap_kind === "first_time"
      ? ` No prior conversation is on record (first_time).`
      : ` Time since the person last spoke with you: ${ctx.since_last} (gap_kind: ${ctx.gap_kind}).`;
  const tail = ` This note is from the time layer, not the person.`;
  return lead + gap + tail;
}
