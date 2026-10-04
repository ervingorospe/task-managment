import { renderHook } from "@testing-library/react";
import {
  OrganizationDefaultsProvider,
  useOrganizationDefaults,
} from "./organization-defaults.provider";

const VALUE = {
  roles: [],
  permissionOptions: [],
  ruleCategories: [],
  tags: [],
  capacity: { members: 20, tags: 20, roles: 10, tickets: 1000, projects: 10 },
};

it("throws when used outside an OrganizationDefaultsProvider", () => {
  expect(() => renderHook(() => useOrganizationDefaults())).toThrow(
    "useOrganizationDefaults must be used within OrganizationDefaultsProvider",
  );
});

it("provides the given defaults to descendants", () => {
  const { result } = renderHook(() => useOrganizationDefaults(), {
    wrapper: ({ children }) => (
      <OrganizationDefaultsProvider {...VALUE}>{children}</OrganizationDefaultsProvider>
    ),
  });
  expect(result.current).toEqual(VALUE);
});
