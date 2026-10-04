import { renderHook, waitFor } from "@testing-library/react";
import { useOrgReferenceData } from "./use-org-reference-data";
import { getPermissionOptions, getRuleCategories } from "@/lib/data/organizations";

jest.mock("@/lib/data/organizations", () => ({
  getPermissionOptions: jest.fn(),
  getRuleCategories: jest.fn(),
}));

const mockedGetOptions = getPermissionOptions as jest.Mock;
const mockedGetCategories = getRuleCategories as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("starts loading with empty defaults, then resolves both fetches", async () => {
  const options = [{ id: 1, action: "ticket.view.all", name: "x", desc: "", categoryId: 1 }];
  const categories = [{ id: 1, name: "Tickets" }];
  mockedGetOptions.mockResolvedValue(options);
  mockedGetCategories.mockResolvedValue(categories);

  const { result } = renderHook(() => useOrgReferenceData());
  expect(result.current.loading).toBe(true);
  expect(result.current.permissionOptions).toEqual([]);
  expect(result.current.ruleCategories).toEqual([]);

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.permissionOptions).toBe(options);
  expect(result.current.ruleCategories).toBe(categories);
});

it("discards a stale response after unmounting", async () => {
  let resolveOptions: (v: unknown) => void;
  mockedGetOptions.mockImplementation(
    () => new Promise((resolve) => (resolveOptions = resolve)),
  );
  mockedGetCategories.mockResolvedValue([]);

  const { unmount } = renderHook(() => useOrgReferenceData());
  unmount();
  resolveOptions!([]);
  await new Promise((r) => setTimeout(r, 0));
});
