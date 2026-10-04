import { ACTIVITY_MODULE_META, ACTIVITY_MODULES } from "./activity-log";

it("has metadata for every activity module", () => {
  expect(ACTIVITY_MODULE_META.ticket.label).toBe("Tickets");
  expect(ACTIVITY_MODULE_META.project.label).toBe("Projects");
  expect(Object.keys(ACTIVITY_MODULE_META)).toHaveLength(6);
});

it("derives the module list from the metadata's own keys", () => {
  expect(ACTIVITY_MODULES).toEqual(
    expect.arrayContaining(["ticket", "request", "member", "role", "tag", "project"]),
  );
  expect(ACTIVITY_MODULES).toHaveLength(6);
});
