import { describe, it, expect } from "vitest";
import {
  zonedParts,
  isoWithOffset,
  partOfDay,
  iso8601Duration,
  daysBetween,
  classifyGap,
  buildTimeContext,
  renderTimeContext,
} from "../src/time.mjs";

describe("zonedParts()", () => {
  it("reads local wall-clock + DST offset for a zone (summer, +02:00)", () => {
    const p = zonedParts(new Date("2026-07-22T05:45:00Z"), "Europe/Paris");
    expect(p).toMatchObject({ year: 2026, month: 7, day: 22, hour: 7, minute: 45, weekday: "Wednesday", offsetMinutes: 120 });
  });
  it("tracks the DST change (winter, +01:00)", () => {
    const p = zonedParts(new Date("2026-01-15T06:30:00Z"), "Europe/Paris");
    expect(p).toMatchObject({ hour: 7, minute: 30, offsetMinutes: 60 });
  });
});

describe("isoWithOffset()", () => {
  it("emits a local offset, never UTC 'Z'", () => {
    const iso = isoWithOffset(zonedParts(new Date("2026-07-22T05:45:00Z"), "Europe/Paris"));
    expect(iso).toBe("2026-07-22T07:45:00+02:00");
    expect(iso).not.toContain("Z");
  });
  it("renders UTC itself as +00:00 (still no bare 'Z')", () => {
    const iso = isoWithOffset(zonedParts(new Date("2026-07-22T05:45:00Z"), "UTC"));
    expect(iso).toBe("2026-07-22T05:45:00+00:00");
  });
});

describe("partOfDay()", () => {
  it("buckets the local hour", () => {
    expect(partOfDay(2)).toBe("night");
    expect(partOfDay(23)).toBe("night");
    expect(partOfDay(7)).toBe("morning");
    expect(partOfDay(14)).toBe("afternoon");
    expect(partOfDay(20)).toBe("evening");
  });
});

describe("iso8601Duration()", () => {
  it("formats hours and minutes", () => expect(iso8601Duration(9 * 3600e3 + 12 * 60e3)).toBe("PT9H12M"));
  it("collapses sub-minute to seconds", () => expect(iso8601Duration(45 * 1000)).toBe("PT45S"));
  it("floors negatives to PT0S", () => expect(iso8601Duration(-5)).toBe("PT0S"));
});

describe("daysBetween()", () => {
  it("counts local calendar days", () => {
    const prev = zonedParts(new Date("2026-07-20T09:00:00Z"), "Europe/Paris");
    const now = zonedParts(new Date("2026-07-22T09:00:00Z"), "Europe/Paris");
    expect(daysBetween(prev, now)).toBe(2);
  });
});

describe("classifyGap()", () => {
  const h = (n: number): number => n * 3_600_000;
  it("first_time when there is no prior timestamp", () => {
    expect(classifyGap({ prevMs: null, nowMs: 1, prevHour: 0, nowHour: 0, dayDiff: 0 })).toEqual({
      since_last: null,
      gap_kind: "first_time",
    });
  });
  it("none under an hour (mid-conversation)", () => {
    expect(classifyGap({ prevMs: 0, nowMs: h(0.5), prevHour: 10, nowHour: 10, dayDiff: 0 }).gap_kind).toBe("none");
  });
  it("same_day for a daytime gap that isn't a sleep", () => {
    expect(classifyGap({ prevMs: 0, nowMs: h(6), prevHour: 9, nowHour: 15, dayDiff: 0 }).gap_kind).toBe("same_day");
  });
  it("overnight across midnight (23:00 → 07:00)", () => {
    expect(classifyGap({ prevMs: 0, nowMs: h(8), prevHour: 23, nowHour: 7, dayDiff: 1 }).gap_kind).toBe("overnight");
  });
  it("overnight PAST midnight on the SAME date (01:30 → 08:00) — the calendar-only trap", () => {
    expect(classifyGap({ prevMs: 0, nowMs: h(6.5), prevHour: 1, nowHour: 8, dayDiff: 0 }).gap_kind).toBe("overnight");
  });
  it("multi_day at two calendar days or more", () => {
    expect(classifyGap({ prevMs: 0, nowMs: h(72), prevHour: 14, nowHour: 14, dayDiff: 3 }).gap_kind).toBe("multi_day");
  });
  it("a clock moved backwards floors to none, never negative", () => {
    const r = classifyGap({ prevMs: h(5), nowMs: 0, prevHour: 12, nowHour: 12, dayDiff: 0 });
    expect(r).toEqual({ since_last: "PT0S", gap_kind: "none" });
  });
});

describe("buildTimeContext()", () => {
  it("assembles the injected object and detects the fell-asleep-last-night case", () => {
    const now = new Date("2026-07-22T05:45:00Z"); // 07:45 Paris, Wed morning
    const prevMs = new Date("2026-07-21T21:00:00Z").getTime(); // 23:00 Paris the night before
    const ctx = buildTimeContext({ now, prevMs, timeZone: "Europe/Paris" });
    expect(ctx).toEqual({
      now: "2026-07-22T07:45:00+02:00",
      zone: "Europe/Paris",
      weekday: "Wednesday",
      part_of_day: "morning",
      since_last: "PT8H45M",
      gap_kind: "overnight",
    });
  });
  it("reports first_time with no prior timestamp", () => {
    const ctx = buildTimeContext({ now: new Date("2026-07-22T05:45:00Z"), prevMs: null, timeZone: "Europe/Paris" });
    expect(ctx).toMatchObject({ since_last: null, gap_kind: "first_time" });
  });
});

describe("renderTimeContext()", () => {
  it("states the authoritative now and the gap, persona-neutral", () => {
    const note = renderTimeContext({
      now: "2026-07-22T07:45:00+02:00",
      zone: "Europe/Paris",
      weekday: "Wednesday",
      part_of_day: "morning",
      since_last: "PT8H45M",
      gap_kind: "overnight",
    });
    expect(note).toContain("2026-07-22T07:45:00+02:00");
    expect(note).toContain("authoritative");
    expect(note).toContain("gap_kind: overnight");
    expect(note).toContain("not the person");
  });
  it("omits the gap clause on first_time", () => {
    const note = renderTimeContext({ now: "x", zone: "z", weekday: "Wednesday", part_of_day: "morning", since_last: null, gap_kind: "first_time" });
    expect(note).toContain("first_time");
    expect(note).not.toContain("gap_kind:");
  });
});
