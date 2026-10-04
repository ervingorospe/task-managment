import {
  PERMISSIONS,
  REQUEST_ALL_PERMISSIONS,
  REQUEST_OWN_PERMISSIONS,
} from "./permissions";

describe("PERMISSIONS", () => {
  it("has the expected action string for a sample of rules", () => {
    expect(PERMISSIONS.ORGANIZATION_CREATE).toBe("organization.create");
    expect(PERMISSIONS.PROJECT_VIEW_OWN).toBe("project.view.own");
    expect(PERMISSIONS.TICKET_VIEW_ALL).toBe("ticket.view.all");
  });
});

describe("REQUEST_ALL_PERMISSIONS", () => {
  it("contains every 'all' tier request permission and none of the 'own' tier", () => {
    expect(REQUEST_ALL_PERMISSIONS).toEqual([
      PERMISSIONS.REQUEST_ALL_CREATE,
      PERMISSIONS.REQUEST_ALL_CANCEL,
      PERMISSIONS.REQUEST_ALL_APPROVE,
      PERMISSIONS.REQUEST_ALL_REJECT,
      PERMISSIONS.REQUEST_ALL_UPDATE,
    ]);
    expect(REQUEST_ALL_PERMISSIONS).not.toContain(PERMISSIONS.REQUEST_OWN_CREATE);
  });
});

describe("REQUEST_OWN_PERMISSIONS", () => {
  it("contains every 'own' tier request permission and none of the 'all' tier", () => {
    expect(REQUEST_OWN_PERMISSIONS).toEqual([
      PERMISSIONS.REQUEST_OWN_CREATE,
      PERMISSIONS.REQUEST_OWN_CANCEL,
      PERMISSIONS.REQUEST_OWN_UPDATE,
    ]);
    expect(REQUEST_OWN_PERMISSIONS).not.toContain(PERMISSIONS.REQUEST_ALL_CREATE);
  });
});
