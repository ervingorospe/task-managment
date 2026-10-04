import { render, screen } from "@testing-library/react";
import { MemberRemovedState } from "./member-removed-state";

it("shows the organization name in the message", () => {
  render(<MemberRemovedState organizationName="Acme Studio" />);
  expect(screen.getByText(/Acme Studio/)).toBeInTheDocument();
});
