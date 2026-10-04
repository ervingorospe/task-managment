import { render, screen } from "@testing-library/react";
import { ActivityLogList } from "./activity-log-list";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

function entry(overrides: Partial<ActivityLogEntry> = {}): ActivityLogEntry {
  return {
    id: 1,
    orgId: 6001,
    module: "ticket",
    action: "created",
    entityId: 1,
    entityLabel: "TCK-1",
    referenceId: "TCK-1",
    actorId: 1,
    actorName: "Jane Doe",
    actorAvatar: null,
    involvedUserIds: [1],
    description: "created this ticket",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

it("shows the default empty state with no entries", () => {
  render(<ActivityLogList entries={[]} />);
  expect(screen.getByText("No activity yet")).toBeInTheDocument();
});

it("shows a custom empty title/subtitle", () => {
  render(
    <ActivityLogList entries={[]} emptyTitle="Nothing yet" emptySubtitle="Custom subtitle" />,
  );
  expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  expect(screen.getByText("Custom subtitle")).toBeInTheDocument();
});

it("renders an entry with its actor, description, reference id, and module label", () => {
  render(<ActivityLogList entries={[entry()]} />);
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText(/created this ticket/)).toBeInTheDocument();
  expect(screen.getByText("TCK-1")).toBeInTheDocument();
  expect(screen.getByText("Tickets")).toBeInTheDocument();
});

it("omits the reference id when the entry has none", () => {
  render(<ActivityLogList entries={[entry({ referenceId: undefined })]} />);
  expect(screen.queryByText("TCK-1")).toBeNull();
});

it("renders multiple entries", () => {
  render(
    <ActivityLogList
      entries={[entry({ id: 1 }), entry({ id: 2, module: "project" })]}
    />,
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Projects")).toBeInTheDocument();
});

it("shows the actor's avatar image when one is set", () => {
  render(
    <ActivityLogList entries={[entry({ actorAvatar: "https://example.com/jane.png" })]} />,
  );
  // next/image rewrites `src` to its own optimizer URL — assert the
  // original URL is encoded inside it rather than an exact match.
  expect(document.querySelector("img")?.getAttribute("src")).toContain(
    encodeURIComponent("https://example.com/jane.png"),
  );
});

it("passes a timeZone through to date formatting", () => {
  render(<ActivityLogList entries={[entry()]} timeZone="UTC" />);
  expect(screen.getByText(/2026/)).toBeInTheDocument();
});
