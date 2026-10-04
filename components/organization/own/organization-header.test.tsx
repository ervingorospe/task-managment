import { render, screen } from "@testing-library/react";
import OrganizationHeader from "./organization-header";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

it("shows the organization's name and description", () => {
  render(
    <OrganizationHeader
      organization={
        {
          organizationName: "Acme Studio",
          organizationDesc: "A design studio",
          settings: { logo: "https://cdn/logo.png" },
        } as OrganizationDetail
      }
    />,
  );
  expect(screen.getByRole("heading", { name: "Acme Studio" })).toBeInTheDocument();
  expect(screen.getByText("A design studio")).toBeInTheDocument();
});
