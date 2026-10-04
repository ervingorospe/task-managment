import {
  getDefaultRoles,
  getPermissionOptions,
  getDefaultTags,
  getRuleCategories,
  getOrgCapacity,
} from "./organizations";
import { api } from "@/lib/api/client";

jest.mock("@/lib/api/client", () => ({
  api: { get: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("getDefaultRoles", () => {
  it("fetches and adapts the default roles", async () => {
    mockedApi.get.mockResolvedValue([
      {
        id: 1,
        roleName: "Superadmin",
        roleDesc: null,
        isDefault: true,
        orgId: null,
        isLocked: true,
        isDeleted: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        rules: [],
      },
    ]);
    const roles = await getDefaultRoles();
    expect(mockedApi.get).toHaveBeenCalledWith("/organizations/defaults/roles");
    expect(roles[0].roleName).toBe("Superadmin");
  });
});

describe("getPermissionOptions", () => {
  it("flattens every category's rules into one list", async () => {
    mockedApi.get.mockResolvedValue([
      { id: 1, name: "Tickets", rules: [{ id: 1, action: "ticket.view.all", name: "View all tickets", desc: "", categoryId: 1 }] },
      { id: 2, name: "Projects", rules: [{ id: 2, action: "project.view", name: "View projects", desc: "", categoryId: 2 }] },
    ]);
    const options = await getPermissionOptions();
    expect(mockedApi.get).toHaveBeenCalledWith("/organizations/defaults/permissions");
    expect(options).toHaveLength(2);
    expect(options[1].action).toBe("project.view");
  });
});

describe("getDefaultTags", () => {
  it("fetches and adapts the default tags", async () => {
    mockedApi.get.mockResolvedValue([
      {
        id: 1,
        orgId: null,
        tagName: "To Do",
        color: "#000",
        isDefault: true,
        isDeleted: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const tags = await getDefaultTags();
    expect(mockedApi.get).toHaveBeenCalledWith("/organizations/defaults/tags");
    expect(tags[0].tagName).toBe("To Do");
  });
});

describe("getRuleCategories", () => {
  it("maps each category to just id/name", async () => {
    mockedApi.get.mockResolvedValue([
      { id: 1, name: "Tickets", rules: [{ id: 1, action: "ticket.view.all", name: "x", desc: "", categoryId: 1 }] },
    ]);
    const categories = await getRuleCategories();
    expect(categories).toEqual([{ id: 1, name: "Tickets" }]);
  });
});

describe("getOrgCapacity", () => {
  it("returns the display-only default capacity, without calling the API", async () => {
    const capacity = await getOrgCapacity();
    expect(capacity).toEqual({
      members: 20,
      tags: 20,
      roles: 10,
      tickets: 1000,
      projects: 10,
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
