import {
  api,
  ApiError,
  ServerUnreachableError,
  isNotFoundOrForbidden,
  toAbsoluteApiUrl,
  SERVER_DOWN_RETURN_TO_KEY,
} from "./client";

// jsdom's window.location is fully locked down (not configurable, matching
// real browser behavior) — it can't be swapped for a mock object, and
// assigning location.href doesn't actually navigate in jsdom (there's
// nothing to load), so it's not observable here either. This file's tests
// run at jsdom's default URL (http://localhost/, i.e. pathname "/") and
// verify the actually-observable side effect instead: what gets written to
// sessionStorage, and that ServerUnreachableError is thrown either way.
// Two sibling files (client.server-down-search.test.ts,
// client.server-down-guard.test.ts) cover the other two branches, each
// pinning jsdom's URL via the @jest-environment-options docblock, since
// that's the only way to control window.location.pathname at all.

// jsdom's test environment doesn't provide the fetch-API Response
// constructor as a global — build a minimal stand-in with just the shape
// client.ts's request() actually reads (status/ok/json()).
function fakeResponse(status: number, body?: unknown): {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
} {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () =>
      body === undefined
        ? Promise.reject(new Error("not json"))
        : Promise.resolve(body),
  };
}

describe("toAbsoluteApiUrl", () => {
  it("leaves an already-absolute URL untouched", () => {
    expect(toAbsoluteApiUrl("https://bucket.s3.amazonaws.com/f.pdf")).toBe(
      "https://bucket.s3.amazonaws.com/f.pdf",
    );
  });

  it("resolves a relative path against the backend origin", () => {
    expect(toAbsoluteApiUrl("/uploads/f.pdf")).toBe(
      "http://localhost:3001/uploads/f.pdf",
    );
  });
});

describe("ApiError", () => {
  it("uses the body's message when present", () => {
    const error = new ApiError(400, { message: "Bad input" });
    expect(error.message).toBe("Bad input");
    expect(error.status).toBe(400);
    expect(error.name).toBe("ApiError");
  });

  it("falls back to a generic message when the body has none", () => {
    expect(new ApiError(500, null).message).toBe("Request failed (500)");
    expect(new ApiError(500, {}).message).toBe("Request failed (500)");
  });
});

describe("ServerUnreachableError", () => {
  it("has a fixed name and message", () => {
    const error = new ServerUnreachableError();
    expect(error.name).toBe("ServerUnreachableError");
    expect(error.message).toBe("Unable to reach the server.");
  });
});

describe("isNotFoundOrForbidden", () => {
  it("is true for a 404 ApiError", () => {
    expect(isNotFoundOrForbidden(new ApiError(404, null))).toBe(true);
  });

  it("is true for a 403 ApiError", () => {
    expect(isNotFoundOrForbidden(new ApiError(403, null))).toBe(true);
  });

  it("is false for any other ApiError status", () => {
    expect(isNotFoundOrForbidden(new ApiError(500, null))).toBe(false);
  });

  it("is false for a non-ApiError value", () => {
    expect(isNotFoundOrForbidden(new Error("boom"))).toBe(false);
    expect(isNotFoundOrForbidden("boom")).toBe(false);
  });
});

describe("api (request internals)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    sessionStorage.clear();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("performs a GET without an Idempotency-Key header", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200, { ok: true }));
    await api.get("/ping");
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:3001/v1/ping");
    expect(init.headers["Idempotency-Key"]).toBeUndefined();
    expect(init.credentials).toBe("include");
  });

  it("adds an Idempotency-Key to a POST with a JSON body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200, { ok: true }));
    await api.post("/things", { name: "x" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["Idempotency-Key"]).toEqual(expect.any(String));
    expect(init.body).toBe(JSON.stringify({ name: "x" }));
  });

  it("omits the body when post()/patch() are called without one", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(204));
    await api.post("/things");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeUndefined();
  });

  it("sends a PATCH with a JSON-stringified body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200, { ok: true }));
    await api.patch("/things/1", { name: "y" });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ name: "y" }));
  });

  it("omits the body when patch() is called without one", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200, { ok: true }));
    await api.patch("/things/1");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeUndefined();
  });

  it("sends a FormData body without a manual Content-Type", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200, { url: "x" }));
    const formData = new FormData();
    formData.append("file", new File(["x"], "f.png"));
    await api.postForm("/upload", formData);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.headers["Idempotency-Key"]).toEqual(expect.any(String));
    expect(init.body).toBe(formData);
  });

  it("returns undefined for a 204 response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(204));
    expect(await api.delete("/things/1")).toBeUndefined();
  });

  it("returns the parsed JSON body for a normal successful response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200, { id: 1 }));
    expect(await api.get("/things/1")).toEqual({ id: 1 });
  });

  it("throws ApiError with the parsed body on a non-ok, non-gateway status", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      fakeResponse(400, { message: "Nope" }),
    );
    await expect(api.get("/things/1")).rejects.toThrow("Nope");
  });

  it("falls back to a null body when the error response isn't valid JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(500));
    await expect(api.get("/things/1")).rejects.toThrow("Request failed (500)");
  });

  it("throws ServerUnreachableError and saves the return-to path when fetch itself throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api.get("/things/1")).rejects.toThrow(ServerUnreachableError);
    // jsdom's default test URL is http://localhost/ (pathname "/").
    expect(sessionStorage.getItem(SERVER_DOWN_RETURN_TO_KEY)).toBe("/");
  });

  it("throws ServerUnreachableError on a 502/503/504 response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(503));
    await expect(api.get("/things/1")).rejects.toThrow(ServerUnreachableError);
    expect(sessionStorage.getItem(SERVER_DOWN_RETURN_TO_KEY)).toBe("/");
  });

  it("throws ApiError, not ServerUnreachableError, for a non-gateway 5xx", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(500));
    await expect(api.get("/things/1")).rejects.toBeInstanceOf(ApiError);
  });
});
