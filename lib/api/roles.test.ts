import { createRole, updateRoleInfo, updateRoleRules, deleteRole } from "./roles";
import { api } from "./client";
import type { RawRole } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_ROLE: RawRole = {
  id: 1,
  roleName: "Admin",
  roleDesc: null,
  isDefault: true,
  orgId: 6001,
  isLocked: false,
  isDeleted: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  rules: [],
};

beforeEach(() => jest.clearAllMocks());

describe("createRole", () => {
  it("maps ruleIds to {id} objects and posts with orgId query param", async () => {
    mockedApi.post.mockResolvedValue(RAW_ROLE);
    await createRole(6001, { roleName: "Admin", ruleIds: [1, 2] });
    expect(mockedApi.post).toHaveBeenCalledWith("/roles?orgId=6001", {
      roleName: "Admin",
      roleDesc: undefined,
      rules: [{ id: 1 }, { id: 2 }],
    });
  });
});

describe("updateRoleInfo", () => {
  it("patches the role's basic info", async () => {
    mockedApi.patch.mockResolvedValue(RAW_ROLE);
    await updateRoleInfo(1, { roleName: "Owner" });
    expect(mockedApi.patch).toHaveBeenCalledWith("/roles/1", { roleName: "Owner" });
  });
});

describe("updateRoleRules", () => {
  it("maps ruleIds and patches the rules sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(RAW_ROLE);
    await updateRoleRules(1, [3, 4]);
    expect(mockedApi.patch).toHaveBeenCalledWith("/roles/1/rules", {
      rules: [{ id: 3 }, { id: 4 }],
    });
  });
});

describe("deleteRole", () => {
  it("deletes the given role id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await deleteRole(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/roles/1");
  });
});
