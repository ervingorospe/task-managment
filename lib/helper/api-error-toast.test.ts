import { shouldToastApiError, apiErrorMessage, notifyApiError } from "./api-error-toast";
import { ApiError } from "@/lib/api/client";

describe("shouldToastApiError", () => {
  it("is false for a 409 ApiError", () => {
    expect(shouldToastApiError(new ApiError(409, null))).toBe(false);
  });

  it("is true for any other ApiError status", () => {
    expect(shouldToastApiError(new ApiError(500, null))).toBe(true);
    expect(shouldToastApiError(new ApiError(404, null))).toBe(true);
  });

  it("is true for a non-ApiError (e.g. a network failure)", () => {
    expect(shouldToastApiError(new Error("network down"))).toBe(true);
  });
});

describe("apiErrorMessage", () => {
  it("uses the ApiError's own message", () => {
    expect(apiErrorMessage(new ApiError(400, { message: "Bad input" }), "fallback")).toBe(
      "Bad input",
    );
  });

  it("uses the fallback for a non-ApiError", () => {
    expect(apiErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });
});

describe("notifyApiError", () => {
  it("toasts the error message when it should be shown", () => {
    const toast = jest.fn();
    notifyApiError(toast, new ApiError(500, { message: "Server error" }), "fallback");
    expect(toast).toHaveBeenCalledWith("Server error", "error");
  });

  it("stays silent for a 409", () => {
    const toast = jest.fn();
    notifyApiError(toast, new ApiError(409, null), "fallback");
    expect(toast).not.toHaveBeenCalled();
  });

  it("uses the fallback message for a non-ApiError", () => {
    const toast = jest.fn();
    notifyApiError(toast, new Error("boom"), "Failed to update assignees");
    expect(toast).toHaveBeenCalledWith("Failed to update assignees", "error");
  });
});
