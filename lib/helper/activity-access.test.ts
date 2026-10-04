import { isActivityEntryIncluded } from "./activity-access";
import type { ActivityLogEntry } from "../types/activity/activity-log-entry.type";

const ENTRY: ActivityLogEntry = {
  id: 1,
  orgId: 6001,
  module: "ticket",
  action: "created",
  entityId: 1,
  entityLabel: "TCK-1",
  actorId: 2,
  actorName: "Jane Doe",
  actorAvatar: null,
  involvedUserIds: [2, 3],
  description: "Jane created TCK-1",
  createdAt: "2026-01-01T00:00:00.000Z",
};

it("is false when userId is undefined", () => {
  expect(isActivityEntryIncluded(ENTRY, undefined)).toBe(false);
});

it("is true when the user is listed as involved", () => {
  expect(isActivityEntryIncluded(ENTRY, 3)).toBe(true);
});

it("is false when the user isn't listed as involved", () => {
  expect(isActivityEntryIncluded(ENTRY, 99)).toBe(false);
});
