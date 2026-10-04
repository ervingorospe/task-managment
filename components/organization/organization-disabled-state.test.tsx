import { render, screen } from "@testing-library/react";
import { OrganizationDisabledState } from "./organization-disabled-state";

it("shows the organization name in the message", () => {
  render(<OrganizationDisabledState organizationName="Acme Studio" />);
  expect(screen.getByText(/Acme Studio/)).toBeInTheDocument();
});

it("renders an action when given", () => {
  render(
    <OrganizationDisabledState
      organizationName="Acme Studio"
      action={<button>Leave organization</button>}
    />,
  );
  expect(screen.getByRole("button", { name: "Leave organization" })).toBeInTheDocument();
});

it("renders no action by default", () => {
  render(<OrganizationDisabledState organizationName="Acme Studio" />);
  expect(screen.queryByRole("button")).toBeNull();
});
