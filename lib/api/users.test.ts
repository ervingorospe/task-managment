import {
  updateUser,
  uploadUserAvatar,
  changeUserPassword,
  deleteUserAccount,
} from "./users";
import { api } from "./client";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      postForm: jest.fn(),
    },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("updateUser", () => {
  it("patches the given user id with the patch payload", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await updateUser(1, { firstName: "Jane" });
    expect(mockedApi.patch).toHaveBeenCalledWith("/users/1", { firstName: "Jane" });
  });
});

describe("uploadUserAvatar", () => {
  it("posts a FormData with the file and returns the url", async () => {
    mockedApi.postForm.mockResolvedValue({ url: "https://cdn/avatar.png" });
    const file = new File(["x"], "avatar.png");
    const url = await uploadUserAvatar(1, file);
    expect(url).toBe("https://cdn/avatar.png");
    const [path, formData] = mockedApi.postForm.mock.calls[0];
    expect(path).toBe("/users/1/avatar");
    expect((formData as FormData).get("file")).toBe(file);
  });
});

describe("changeUserPassword", () => {
  it("patches the password endpoint", async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    const payload = { newPassword: "x", confirmPassword: "x" };
    await changeUserPassword(1, payload);
    expect(mockedApi.patch).toHaveBeenCalledWith("/users/1/password", payload);
  });
});

describe("deleteUserAccount", () => {
  it("deletes the given user id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await deleteUserAccount(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/users/1");
  });
});
