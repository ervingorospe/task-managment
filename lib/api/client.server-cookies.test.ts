/**
 * @jest-environment node
 */
// request()'s `typeof window === "undefined"` branch (forwarding the
// session cookie on a server-side fetch) only exists when window really
// is undefined — jsdom always defines it, so this one branch needs a
// dedicated node-environment file. See client.ts's own comment on why
// this branch exists at all (Server Components run this fetch from the
// Next.js server, not the browser).
import { api, ServerUnreachableError } from "./client";

const mockCookies = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

function fakeResponse(status: number, body: unknown = {}) {
  return { status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(fakeResponse(200, { ok: true }));
});

it("forwards the session cookie when present", async () => {
  mockCookies.mockResolvedValue({
    get: (name: string) =>
      name === "ticketing_auth" ? { value: "abc123" } : undefined,
  });

  await api.get("/things/1");

  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(init.headers["Cookie"]).toBe("ticketing_auth=abc123");
});

it("omits the Cookie header when there's no session cookie", async () => {
  mockCookies.mockResolvedValue({ get: () => undefined });

  await api.get("/things/1");

  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(init.headers["Cookie"]).toBeUndefined();
});

it("still throws ServerUnreachableError on a network failure, without touching window", async () => {
  mockCookies.mockResolvedValue({ get: () => undefined });
  global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

  // handleServerUnreachable()'s `typeof window === "undefined"` guard is
  // what's actually under test here — there's no window at all in this
  // node environment, so it must bail out before touching
  // location/sessionStorage rather than throwing a ReferenceError.
  await expect(api.get("/things/1")).rejects.toThrow(ServerUnreachableError);
});
