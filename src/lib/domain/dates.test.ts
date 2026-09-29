import { describe, expect, test } from "vitest";
import {
  formatCalendarDate,
  fromCalendarDate,
  isCalendarDateString,
  toCalendarDate,
} from "./dates";

test("the suite runs outside UTC, so timezone bugs can surface", () => {
  expect(new Date(Date.UTC(2026, 0, 15)).getTimezoneOffset()).not.toBe(0);
});

describe("isCalendarDateString", () => {
  test.each(["2026-02-28", "2028-02-29", "1970-01-01", "2999-12-31"])(
    "accepts %s",
    (value) => expect(isCalendarDateString(value)).toBe(true),
  );

  test.each([
    ["an impossible day", "2026-02-30"],
    ["a non-leap February 29", "2026-02-29"],
    ["a five-digit year", "20265-01-01"],
    ["month 13", "2026-13-01"],
    ["a year before 1970", "1969-12-31"],
    ["a year after 2999", "3000-01-01"],
    ["a missing zero pad", "2026-3-10"],
    ["a timestamp", "2026-03-10T00:00:00Z"],
    ["an empty string", ""],
  ])("rejects %s", (_label, value) => {
    expect(isCalendarDateString(value)).toBe(false);
  });
});

describe("toCalendarDate and fromCalendarDate", () => {
  test("store UTC midnight and read back the same calendar day", () => {
    const date = toCalendarDate("2026-03-10");
    expect(date.toISOString()).toBe("2026-03-10T00:00:00.000Z");
    expect(fromCalendarDate(date)).toBe("2026-03-10");
  });

  test("formats for display without shifting the day", () => {
    expect(formatCalendarDate(toCalendarDate("2026-03-10"))).toBe("10 Mar 2026");
    expect(formatCalendarDate(toCalendarDate("2026-01-01"))).toBe("1 Jan 2026");
  });

  test("survive a local day boundary that differs from UTC", () => {
    // Late evening in Los Angeles is already the next day in UTC.
    expect(fromCalendarDate(toCalendarDate("2026-12-31"))).toBe("2026-12-31");
  });
});
