import { createTag, updateTag, deleteTag } from "./tags";
import { api } from "./client";
import type { RawTag } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_TAG: RawTag = {
  id: 1,
  orgId: 6001,
  tagName: "To Do",
  color: "#00FA9A",
  isDefault: false,
  isDeleted: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => jest.clearAllMocks());

describe("createTag", () => {
  it("posts to /tags with the orgId query param", async () => {
    mockedApi.post.mockResolvedValue(RAW_TAG);
    const tag = await createTag(6001, { tagName: "To Do", color: "#00FA9A" });
    expect(mockedApi.post).toHaveBeenCalledWith("/tags?orgId=6001", {
      tagName: "To Do",
      color: "#00FA9A",
    });
    expect(tag.id).toBe(1);
  });
});

describe("updateTag", () => {
  it("patches the given tag id", async () => {
    mockedApi.patch.mockResolvedValue(RAW_TAG);
    await updateTag(1, { color: "#FF0000" });
    expect(mockedApi.patch).toHaveBeenCalledWith("/tags/1", { color: "#FF0000" });
  });
});

describe("deleteTag", () => {
  it("deletes the given tag id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await deleteTag(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/tags/1");
  });
});
