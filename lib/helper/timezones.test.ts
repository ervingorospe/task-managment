import { getSystemTimezone, getTimezoneList } from "./timezones";

describe("getSystemTimezone", () => {
  it("returns the resolved IANA timezone", () => {
    expect(getSystemTimezone()).toEqual(expect.any(String));
  });

  it("falls back to UTC if Intl.DateTimeFormat throws", () => {
    const spy = jest.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("boom");
    });
    expect(getSystemTimezone()).toBe("UTC");
    spy.mockRestore();
  });
});

describe("getTimezoneList", () => {
  it("uses Intl.supportedValuesOf when available", () => {
    const spy = jest
      .spyOn(Intl as unknown as { supportedValuesOf: (key: string) => string[] }, "supportedValuesOf")
      .mockReturnValue(["UTC", "Asia/Manila"]);
    expect(getTimezoneList()).toEqual(["UTC", "Asia/Manila"]);
    spy.mockRestore();
  });

  it("falls back to the static list when supportedValuesOf throws", () => {
    const spy = jest
      .spyOn(Intl as unknown as { supportedValuesOf: (key: string) => string[] }, "supportedValuesOf")
      .mockImplementation(() => {
        throw new Error("not supported");
      });
    expect(getTimezoneList()).toContain("UTC");
    expect(getTimezoneList()).toContain("Asia/Manila");
    spy.mockRestore();
  });

  it("falls back to the static list when supportedValuesOf doesn't exist", () => {
    const original = (Intl as unknown as { supportedValuesOf?: unknown }).supportedValuesOf;
    delete (Intl as unknown as { supportedValuesOf?: unknown }).supportedValuesOf;
    expect(getTimezoneList()).toContain("America/New_York");
    (Intl as unknown as { supportedValuesOf?: unknown }).supportedValuesOf = original;
  });
});
