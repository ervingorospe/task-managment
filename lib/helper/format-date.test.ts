import { formatDateTime, formatDate, getTodayInTimeZone, formatRelative } from "./format-date";

describe("formatDateTime", () => {
  it("formats a date with month/day/year/time", () => {
    const result = formatDateTime("2026-03-15T14:30:00.000Z", "UTC");
    expect(result).toContain("2026");
    expect(result).toContain("Mar");
  });
});

describe("formatDate", () => {
  it("formats a date with a full month name", () => {
    const result = formatDate("2026-03-15T14:30:00.000Z", "UTC");
    expect(result).toContain("March");
    expect(result).toContain("2026");
  });
});

describe("getTodayInTimeZone", () => {
  it("returns today's date in YYYY-MM-DD form", () => {
    expect(getTodayInTimeZone("UTC")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatRelative", () => {
  const NOW = new Date("2026-03-15T12:00:00.000Z").getTime();

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 'today' for right now", () => {
    expect(formatRelative(new Date(NOW).toISOString())).toBe("today");
  });

  it("returns 'today' for a future date (non-positive days)", () => {
    expect(formatRelative(new Date(NOW + 1000 * 60 * 60).toISOString())).toBe("today");
  });

  it("returns 'yesterday' for exactly 1 day ago", () => {
    expect(formatRelative(new Date(NOW - 1000 * 60 * 60 * 24).toISOString())).toBe(
      "yesterday",
    );
  });

  it("returns 'N days ago' for under a month", () => {
    expect(formatRelative(new Date(NOW - 1000 * 60 * 60 * 24 * 5).toISOString())).toBe(
      "5 days ago",
    );
  });

  it("returns 'N month ago' (singular) at exactly one month", () => {
    expect(formatRelative(new Date(NOW - 1000 * 60 * 60 * 24 * 30).toISOString())).toBe(
      "1 month ago",
    );
  });

  it("returns 'N months ago' (plural) under a year", () => {
    expect(formatRelative(new Date(NOW - 1000 * 60 * 60 * 24 * 90).toISOString())).toBe(
      "3 months ago",
    );
  });

  it("returns 'N year ago' (singular) at exactly one year", () => {
    expect(formatRelative(new Date(NOW - 1000 * 60 * 60 * 24 * 360).toISOString())).toBe(
      "1 year ago",
    );
  });

  it("returns 'N years ago' (plural) for multiple years", () => {
    expect(formatRelative(new Date(NOW - 1000 * 60 * 60 * 24 * 800).toISOString())).toBe(
      "2 years ago",
    );
  });
});
