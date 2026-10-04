jest.mock("@/components/organization/own/panels/organization-information", () => ({
  __esModule: true,
  default: (props: { organization: { organizationName: string } }) => (
    <div data-testid="organization-information">{props.organization.organizationName}</div>
  ),
}));

import { render, screen } from "@testing-library/react";
import OrganizaionTab from "./organization-tab";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

it("renders OrganizationInformation with the organization prop", () => {
  const organization = { organizationName: "Acme Studio" } as OrganizationDetail;
  render(<OrganizaionTab organization={organization} />);
  expect(screen.getByTestId("organization-information")).toHaveTextContent("Acme Studio");
});
