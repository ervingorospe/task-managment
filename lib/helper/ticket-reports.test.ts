// Several functions here parse "YYYY-MM-DDT00:00:00" (no zone) as local
// time then re-derive a UTC date string — TZ is pinned to UTC in
// jest.config.js (not here) so that round-trip is deterministic regardless
// of the machine running the suite.
import {
  filterTicketsByDateRange,
  getStatusBreakdown,
  getDueSummary,
  getTrendSeries,
  getMonthComparisonSeries,
  getYearComparisonSeries,
} from "./ticket-reports";
import type { TicketDetail } from "../types/ticket/ticket-detail.type";
import type { TagDetail } from "../types/organization/tag-detail.type";

let nextId = 1;

function tag(id: number, tagName: string, color = "#000"): TagDetail {
  return { id, tagName, color, isDefault: false, isDeleted: false };
}

const TODO = tag(1, "To Do");
const DONE = tag(2, "Done");

function ticket(overrides: Partial<TicketDetail> & { createdAt: string }): TicketDetail {
  return {
    id: nextId++,
    referenceId: `TCK-${nextId}`,
    orgId: 6001,
    ownerId: null,
    projectId: null,
    project: null,
    title: "Ticket",
    attachments: [],
    tag: TODO,
    client: null,
    assignees: [],
    dueDate: null,
    starred: false,
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

describe("filterTicketsByDateRange", () => {
  const tickets = [
    ticket({ createdAt: "2026-01-05T00:00:00.000Z" }),
    ticket({ createdAt: "2026-01-10T00:00:00.000Z" }),
    ticket({ createdAt: "2026-01-20T00:00:00.000Z" }),
  ];

  it("is a no-op when either bound is missing", () => {
    expect(filterTicketsByDateRange(tickets, { from: null, to: "2026-01-10" })).toBe(
      tickets,
    );
    expect(filterTicketsByDateRange(tickets, { from: "2026-01-01", to: null })).toBe(
      tickets,
    );
  });

  it("keeps tickets created within the inclusive range", () => {
    const result = filterTicketsByDateRange(tickets, {
      from: "2026-01-05",
      to: "2026-01-10",
    });
    expect(result).toHaveLength(2);
  });
});

describe("getStatusBreakdown", () => {
  it("groups by tag and sorts by count descending", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", tag: TODO }),
      ticket({ createdAt: "2026-01-02T00:00:00.000Z", tag: TODO }),
      ticket({ createdAt: "2026-01-03T00:00:00.000Z", tag: DONE }),
    ];
    expect(getStatusBreakdown(tickets)).toEqual([
      { tagId: TODO.id, tagName: "To Do", color: TODO.color, count: 2 },
      { tagId: DONE.id, tagName: "Done", color: DONE.color, count: 1 },
    ]);
  });

  it("returns an empty array for no tickets", () => {
    expect(getStatusBreakdown([])).toEqual([]);
  });
});

describe("getDueSummary", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("counts overdue vs on-time, ignoring only tickets with no due date at all", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-03-10", tag: TODO }), // overdue
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-03-20", tag: TODO }), // on time
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", dueDate: null, tag: TODO }), // no due date, ignored
      // A terminal (Done) tag makes getDueState() never report "overdue" for
      // it, but getDueSummary only special-cases the overdue branch — a
      // terminal ticket with a due date still lands in onTime, not ignored.
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-03-01", tag: DONE }),
    ];
    expect(getDueSummary(tickets)).toEqual({ total: 3, overdue: 1, onTime: 2 });
  });
});

describe("getTrendSeries", () => {
  it("returns [] when the day window is empty (no range, no tickets)", () => {
    expect(
      getTrendSeries([], [], {
        selection: { created: true, dueDate: false, tagIds: [] },
        range: { from: null, to: null },
      }),
    ).toEqual([]);
  });

  it("builds a 'created' series bucketed over an explicit range", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-01T00:00:00.000Z" }),
      ticket({ createdAt: "2026-01-01T00:00:00.000Z" }),
      ticket({ createdAt: "2026-01-03T00:00:00.000Z" }),
    ];
    const series = getTrendSeries(tickets, [], {
      selection: { created: true, dueDate: false, tagIds: [] },
      range: { from: "2026-01-01", to: "2026-01-03" },
    });
    expect(series).toHaveLength(1);
    expect(series[0].id).toBe("created");
    expect(series[0].points.map((p) => p.y)).toEqual([2, 0, 1]);
  });

  it("builds a 'dueDate' series, skipping tickets with no due date", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-01-02" }),
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", dueDate: null }),
    ];
    const series = getTrendSeries(tickets, [], {
      selection: { created: false, dueDate: true, tagIds: [] },
      range: { from: "2026-01-01", to: "2026-01-02" },
    });
    expect(series[0].id).toBe("dueDate");
    expect(series[0].points.map((p) => p.y)).toEqual([0, 1]);
  });

  it("builds one series per selected tag, skipping unselected tags and other tags' tickets", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-01T00:00:00.000Z", tag: TODO }),
      ticket({ createdAt: "2026-01-02T00:00:00.000Z", tag: DONE }),
    ];
    const series = getTrendSeries(tickets, [TODO, DONE], {
      selection: { created: false, dueDate: false, tagIds: [TODO.id] },
      range: { from: "2026-01-01", to: "2026-01-02" },
    });
    expect(series).toHaveLength(1);
    expect(series[0].id).toBe(`tag-${TODO.id}`);
    // Day 1 has the TODO ticket; day 2 only has the (unselected-tag) DONE
    // ticket, so it must fall back to 0 rather than leaking DONE's count.
    expect(series[0].points.map((p) => p.y)).toEqual([1, 0]);
  });

  it("falls back to a trailing window anchored to the latest ticket when no range is given", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-10T00:00:00.000Z" }),
      ticket({ createdAt: "2026-01-15T00:00:00.000Z" }),
    ];
    const series = getTrendSeries(tickets, [], {
      selection: { created: true, dueDate: false, tagIds: [] },
      range: { from: null, to: null },
      days: 3,
    });
    // Anchored to 2026-01-15 (the latest), trailing 3 days: 13th, 14th, 15th.
    expect(series[0].points).toHaveLength(3);
    expect(series[0].points[2].y).toBe(1);
  });
});

describe("getMonthComparisonSeries", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("buckets each month's tickets by day-of-month", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-05T00:00:00.000Z" }),
      ticket({ createdAt: "2026-01-05T00:00:00.000Z" }),
      ticket({ createdAt: "2026-02-10T00:00:00.000Z" }),
    ];
    const [seriesA, seriesB] = getMonthComparisonSeries(tickets, {
      monthA: "2026-01",
      monthB: "2026-02",
      tagIds: [],
      overdueOnly: false,
    });
    expect(seriesA.points).toHaveLength(31);
    expect(seriesA.points[4].y).toBe(2); // day 5, index 4
    expect(seriesB.points[9].y).toBe(1); // day 10, index 9
  });

  it("filters by tagIds when given", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-05T00:00:00.000Z", tag: TODO }),
      ticket({ createdAt: "2026-01-05T00:00:00.000Z", tag: DONE }),
    ];
    const [seriesA] = getMonthComparisonSeries(tickets, {
      monthA: "2026-01",
      monthB: "2026-02",
      tagIds: [TODO.id],
      overdueOnly: false,
    });
    expect(seriesA.points[4].y).toBe(1);
  });

  it("filters to only overdue tickets when overdueOnly is set", () => {
    const tickets = [
      ticket({ createdAt: "2026-01-05T00:00:00.000Z", dueDate: "2026-01-06" }), // overdue (before 2026-03-15)
      ticket({ createdAt: "2026-01-05T00:00:00.000Z", dueDate: "2026-12-01" }), // not overdue
    ];
    const [seriesA] = getMonthComparisonSeries(tickets, {
      monthA: "2026-01",
      monthB: "2026-02",
      tagIds: [],
      overdueOnly: true,
    });
    expect(seriesA.points[4].y).toBe(1);
  });
});

describe("getYearComparisonSeries", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("buckets each year's tickets by month", () => {
    const tickets = [
      ticket({ createdAt: "2025-06-01T00:00:00.000Z" }),
      ticket({ createdAt: "2025-06-15T00:00:00.000Z" }),
      ticket({ createdAt: "2026-01-01T00:00:00.000Z" }),
    ];
    const [seriesA, seriesB] = getYearComparisonSeries(tickets, {
      yearA: "2025",
      yearB: "2026",
      tagIds: [],
      overdueOnly: false,
    });
    expect(seriesA.points).toHaveLength(12);
    expect(seriesA.points[5].y).toBe(2); // June, index 5
    expect(seriesB.points[0].y).toBe(1); // January, index 0
  });

  it("filters by tagIds and overdueOnly", () => {
    const tickets = [
      // Overdue (due before the fake "today" of 2026-03-15) — kept.
      ticket({ createdAt: "2025-06-01T00:00:00.000Z", tag: TODO, dueDate: "2025-06-02" }),
      // Same month/tag, but not overdue (due in the future) — filtered out.
      ticket({ createdAt: "2025-06-15T00:00:00.000Z", tag: TODO, dueDate: "2026-12-01" }),
      // Wrong tag — filtered out regardless of overdueOnly.
      ticket({ createdAt: "2025-06-01T00:00:00.000Z", tag: DONE, dueDate: "2025-06-02" }),
    ];
    const [seriesA] = getYearComparisonSeries(tickets, {
      yearA: "2025",
      yearB: "2026",
      tagIds: [TODO.id],
      overdueOnly: true,
    });
    expect(seriesA.points[5].y).toBe(1);
  });
});
