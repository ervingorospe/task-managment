import { fetchProjectById, createProject, updateProject, deleteProject } from "./projects";
import { api, ApiError } from "./client";
import type { RawProject } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_PROJECT: RawProject = {
  id: 1,
  orgId: 6001,
  name: "Website Revamp",
  description: null,
  clientId: null,
  client: null,
  assignees: [],
  isDeleted: false,
} as unknown as RawProject;

beforeEach(() => jest.clearAllMocks());

describe("fetchProjectById", () => {
  it("returns the adapted project on success", async () => {
    mockedApi.get.mockResolvedValue(RAW_PROJECT);
    const project = await fetchProjectById(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/projects/1");
    expect(project?.id).toBe(1);
  });

  it("returns null on 404", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(404, null));
    expect(await fetchProjectById(999)).toBeNull();
  });

  it("returns null on 403", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(403, null));
    expect(await fetchProjectById(999)).toBeNull();
  });

  it("rethrows any other error", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(500, null));
    await expect(fetchProjectById(1)).rejects.toThrow();
  });
});

describe("createProject", () => {
  it("posts with the orgId query param", async () => {
    mockedApi.post.mockResolvedValue(RAW_PROJECT);
    const payload = { name: "Website Revamp" };
    await createProject(6001, payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/projects?orgId=6001", payload);
  });
});

describe("updateProject", () => {
  it("patches the given project id", async () => {
    mockedApi.patch.mockResolvedValue(RAW_PROJECT);
    await updateProject(1, { clientId: null });
    expect(mockedApi.patch).toHaveBeenCalledWith("/projects/1", { clientId: null });
  });
});

describe("deleteProject", () => {
  it("deletes the given project id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await deleteProject(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/projects/1");
  });
});
