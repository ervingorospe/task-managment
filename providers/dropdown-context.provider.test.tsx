import { renderHook } from "@testing-library/react";
import { DropdownContextProvider, useDropdown } from "./dropdown-context.provider";

it("throws when used outside a DropdownContextProvider", () => {
  expect(() => renderHook(() => useDropdown())).toThrow(
    "useDropdown must be used inside a Dropdown",
  );
});

it("provides the close function to descendants", () => {
  const close = jest.fn();
  const { result } = renderHook(() => useDropdown(), {
    wrapper: ({ children }) => (
      <DropdownContextProvider close={close}>{children}</DropdownContextProvider>
    ),
  });
  result.current.close();
  expect(close).toHaveBeenCalledTimes(1);
});
