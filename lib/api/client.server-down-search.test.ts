/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:3000/dashboard/tickets?page=2"}
 */
// Pinned to a path with a query string, since window.location can't be
// reassigned mid-test (see client.test.ts's header comment) — this is the
// only way to exercise the pathname+search concatenation.
import { api, ServerUnreachableError, SERVER_DOWN_RETURN_TO_KEY } from "./client";

beforeEach(() => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  sessionStorage.clear();
});

it("includes the query string in the saved return-to path", async () => {
  await expect(api.get("/things/1")).rejects.toThrow(ServerUnreachableError);
  expect(sessionStorage.getItem(SERVER_DOWN_RETURN_TO_KEY)).toBe(
    "/dashboard/tickets?page=2",
  );
});
