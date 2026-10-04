/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost:3000/server-down"}
 */
// Pinned to /server-down itself, since window.location can't be reassigned
// mid-test (see client.test.ts's header comment) — this is the only way to
// exercise handleServerUnreachable()'s early-return guard.
import { api, ServerUnreachableError, SERVER_DOWN_RETURN_TO_KEY } from "./client";

beforeEach(() => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  sessionStorage.clear();
});

it("does not touch sessionStorage when already on /server-down", async () => {
  await expect(api.get("/things/1")).rejects.toThrow(ServerUnreachableError);
  expect(sessionStorage.getItem(SERVER_DOWN_RETURN_TO_KEY)).toBeNull();
});
