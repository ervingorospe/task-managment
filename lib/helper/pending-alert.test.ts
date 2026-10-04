import { setPendingAlert, consumePendingAlert } from "./pending-alert";

const STORAGE_KEY = "pending-inline-alert";

beforeEach(() => sessionStorage.clear());

describe("setPendingAlert", () => {
  it("stores the message with a default 'success' variant", () => {
    setPendingAlert("Ticket removed");
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ message: "Ticket removed", variant: "success" }),
    );
  });

  it("stores a custom variant when given", () => {
    setPendingAlert("Something went wrong", "error");
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ message: "Something went wrong", variant: "error" }),
    );
  });
});

describe("consumePendingAlert", () => {
  it("returns null when nothing is pending", () => {
    expect(consumePendingAlert()).toBeNull();
  });

  it("returns and clears a pending alert", () => {
    setPendingAlert("Ticket removed", "success");
    expect(consumePendingAlert()).toEqual({
      message: "Ticket removed",
      variant: "success",
    });
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns null for malformed stored JSON instead of throwing", () => {
    sessionStorage.setItem(STORAGE_KEY, "{not json");
    expect(consumePendingAlert()).toBeNull();
  });
});
