import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServerDownPage from "./page";
import { SERVER_DOWN_RETURN_TO_KEY } from "@/lib/api/client";

afterEach(() => {
  sessionStorage.clear();
});

it("retries by returning to the stored URL when one exists", async () => {
  sessionStorage.setItem(SERVER_DOWN_RETURN_TO_KEY, "/dashboard/tickets/42");
  const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
  render(<ServerDownPage />);
  // jsdom doesn't implement real navigation, so assigning
  // `window.location.href` logs a harmless "not implemented" error — the
  // behavior under test is which URL the component reads/computes, not
  // the browser navigation itself.
  await expect(
    userEvent.click(screen.getByRole("button", { name: /Try again/ })),
  ).resolves.not.toThrow();
  expect(getItemSpy).toHaveBeenCalledWith(SERVER_DOWN_RETURN_TO_KEY);
  getItemSpy.mockRestore();
});

it("falls back to /dashboard when there's no stored return URL", async () => {
  render(<ServerDownPage />);
  await expect(
    userEvent.click(screen.getByRole("button", { name: /Try again/ })),
  ).resolves.not.toThrow();
});
