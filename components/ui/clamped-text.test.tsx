import { render, screen, waitFor } from "@testing-library/react";
import { ClampedText } from "./clamped-text";

it("does not crash when the deferred overflow check's rAF callback fires after unmount", () => {
  // The effect never cancels its requestAnimationFrame callback, so it can
  // still fire after unmount — ref.current is null by then, which the
  // callback's own guard must handle instead of throwing. Stubbing rAF to
  // run synchronously (jsdom's real one is timer-based and unreliable to
  // await deterministically) lets this assert the guard directly.
  let fire: () => void = () => {};
  const rafSpy = jest
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb) => {
      fire = () => cb(0);
      return 1;
    });

  const { unmount } = render(<ClampedText text="Some text" href="/tickets/1" />);
  unmount();
  expect(() => fire()).not.toThrow();

  rafSpy.mockRestore();
});

it("renders the text but no 'View more' link when it doesn't overflow", async () => {
  render(<ClampedText text="Short text" href="/tickets/1" />);
  expect(screen.getByText("Short text")).toBeInTheDocument();
  // jsdom reports 0/0 for scrollHeight/clientHeight by default, i.e. no
  // overflow — give the rAF callback a tick to settle either way.
  await new Promise((r) => setTimeout(r, 0));
  expect(screen.queryByText("View more")).toBeNull();
});

it("shows a 'View more' link once the text actually overflows", async () => {
  const { container, rerender } = render(
    <ClampedText text="A very long ticket description that overflows" href="/tickets/1" />,
  );
  const p = container.querySelector("p")!;
  Object.defineProperty(p, "scrollHeight", { value: 100, configurable: true });
  Object.defineProperty(p, "clientHeight", { value: 40, configurable: true });

  // The effect depends on [text] — changing it re-triggers the measurement.
  rerender(
    <ClampedText
      text="A very long ticket description that overflows, changed"
      href="/tickets/1"
    />,
  );

  await waitFor(() =>
    expect(screen.getByRole("link", { name: "View more" })).toBeInTheDocument(),
  );
  expect(screen.getByRole("link", { name: "View more" })).toHaveAttribute("href", "/tickets/1");
});
