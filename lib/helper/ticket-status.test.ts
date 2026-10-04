import { localToday, formatDueDate, getDueState, formatFileSize, isDueThisWeek } from "./ticket-status";
import type { TicketDetail } from "../types/ticket/ticket-detail.type";

function ticketWith(dueDate: string | null, tagName = "To Do"): Pick<TicketDetail, "dueDate" | "tag"> {
  return {
    dueDate,
    tag: { id: 1, tagName, color: "#000", isDefault: false, isDeleted: false },
  };
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2026-03-15T12:00:00"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("localToday", () => {
  it("returns today's date in YYYY-MM-DD form, in local time", () => {
    expect(localToday()).toBe("2026-03-15");
  });
});

describe("formatDueDate", () => {
  it("returns null for a null date", () => {
    expect(formatDueDate(null)).toBeNull();
  });

  it("formats a date anchored to UTC regardless of stored time-of-day", () => {
    expect(formatDueDate("2026-09-21T23:00:00.000Z")).toBe("Sep 21");
  });
});

describe("getDueState", () => {
  it("is null when there's no due date", () => {
    expect(getDueState(ticketWith(null))).toBeNull();
  });

  it("is null for a terminal tag even if overdue", () => {
    expect(getDueState(ticketWith("2026-03-01", "Done"))).toBeNull();
    expect(getDueState(ticketWith("2026-03-01", "Cancelled"))).toBeNull();
  });

  it("is 'overdue' when the due day is before today", () => {
    expect(getDueState(ticketWith("2026-03-14"))).toBe("overdue");
  });

  it("is 'due-today' when the due day is today", () => {
    expect(getDueState(ticketWith("2026-03-15"))).toBe("due-today");
  });

  it("is null when the due day is in the future", () => {
    expect(getDueState(ticketWith("2026-03-20"))).toBeNull();
  });
});

describe("formatFileSize", () => {
  it("shows KB for anything under 1MB", () => {
    expect(formatFileSize(500 * 1024)).toBe("500 KB");
  });

  it("shows MB with one decimal for 1MB and above", () => {
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});

describe("isDueThisWeek", () => {
  it("is false when there's no due date", () => {
    expect(isDueThisWeek(ticketWith(null))).toBe(false);
  });

  it("is false when already overdue", () => {
    expect(isDueThisWeek(ticketWith("2026-03-14"))).toBe(false);
  });

  it("is true for a due date today", () => {
    expect(isDueThisWeek(ticketWith("2026-03-15"))).toBe(true);
  });

  it("is true for a due date exactly 7 days out", () => {
    expect(isDueThisWeek(ticketWith("2026-03-22"))).toBe(true);
  });

  it("is false for a due date beyond 7 days", () => {
    expect(isDueThisWeek(ticketWith("2026-03-23"))).toBe(false);
  });
});
