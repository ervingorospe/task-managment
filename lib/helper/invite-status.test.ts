import { getInviteExpiryState, formatInviteExpiry } from "./invite-status";

const NOW = new Date("2026-03-15T12:00:00.000Z").getTime();

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getInviteExpiryState", () => {
  it("is null when there's no expiry", () => {
    expect(getInviteExpiryState({ expiry: undefined })).toBeNull();
  });

  it("is 'expired' once the expiry has passed", () => {
    expect(
      getInviteExpiryState({ expiry: new Date(NOW - 1000).toISOString() }),
    ).toBe("expired");
  });

  it("is 'expiring-soon' within the 1 hour threshold", () => {
    expect(
      getInviteExpiryState({ expiry: new Date(NOW + 1000 * 60 * 30).toISOString() }),
    ).toBe("expiring-soon");
  });

  it("is null when well beyond the threshold", () => {
    expect(
      getInviteExpiryState({ expiry: new Date(NOW + 1000 * 60 * 60 * 5).toISOString() }),
    ).toBeNull();
  });
});

describe("formatInviteExpiry", () => {
  it("is null when there's no expiry", () => {
    expect(formatInviteExpiry({ expiry: undefined })).toBeNull();
  });

  it("shows 'Expired' once passed", () => {
    expect(formatInviteExpiry({ expiry: new Date(NOW - 1000).toISOString() })).toBe(
      "Expired",
    );
  });

  it("shows minutes under an hour", () => {
    expect(
      formatInviteExpiry({ expiry: new Date(NOW + 1000 * 60 * 30).toISOString() }),
    ).toBe("Expires in 30m");
  });

  it("shows hours under a day", () => {
    expect(
      formatInviteExpiry({ expiry: new Date(NOW + 1000 * 60 * 60 * 5).toISOString() }),
    ).toBe("Expires in 5h");
  });

  it("shows days for anything longer", () => {
    expect(
      formatInviteExpiry({ expiry: new Date(NOW + 1000 * 60 * 60 * 24 * 3).toISOString() }),
    ).toBe("Expires in 3d");
  });
});
