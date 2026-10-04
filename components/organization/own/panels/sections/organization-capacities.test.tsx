jest.mock("@/providers/organization-defaults.provider", () => ({
  useOrganizationDefaults: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import Capacities from "./organization-capacities";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";

const mockedUseOrgDefaults = useOrganizationDefaults as jest.Mock;

it("shows every capacity item with its value and description", () => {
  mockedUseOrgDefaults.mockReturnValue({
    capacity: { members: 10, tags: 20, roles: 5, tickets: 1000, projects: 15 },
  });
  render(<Capacities />);

  expect(screen.getByText("Organization Limits")).toBeInTheDocument();
  function value(label: string) {
    return screen.getByText(label).nextElementSibling?.textContent;
  }
  expect(value("Members")).toBe("10");
  expect(value("Tags")).toBe("20");
  expect(value("Roles")).toBe("5");
  expect(value("Tickets")).toBe("1000");
  expect(value("Projects")).toBe("15");
  expect(screen.getByText("Maximum members allowed in the organization.")).toBeInTheDocument();
});
