import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrganizationTabs from "./organization-tabs";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("./organization-header", () => function MockOrganizationHeader() {
  return <div>OrganizationHeader</div>;
});
jest.mock("./panels/organization-information", () => function MockOrganizationInformation() {
  return <div>OrganizationInformation</div>;
});
jest.mock("./panels/organization-members", () => function MockOrganizationMembers() {
  return <div>OrganizationMembers</div>;
});
jest.mock("./panels/organization-settings", () => function MockOrganizationSettings() {
  return <div>OrganizationSettings</div>;
});

const organization = { id: 6001, organizationName: "Acme Studio" } as unknown as OrganizationDetail;

it("shows the header and the Information tab by default", () => {
  render(<OrganizationTabs organization={organization} />);
  expect(screen.getByText("OrganizationHeader")).toBeInTheDocument();
  expect(screen.getByText("OrganizationInformation")).toBeInTheDocument();
  expect(screen.queryByText("OrganizationMembers")).toBeNull();
  expect(screen.queryByText("OrganizationSettings")).toBeNull();
});

it("switches to the Members tab", async () => {
  render(<OrganizationTabs organization={organization} />);
  await userEvent.click(screen.getByRole("button", { name: "Members" }));
  expect(screen.getByText("OrganizationMembers")).toBeInTheDocument();
  expect(screen.queryByText("OrganizationInformation")).toBeNull();
});

it("switches to the Settings tab", async () => {
  render(<OrganizationTabs organization={organization} />);
  await userEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(screen.getByText("OrganizationSettings")).toBeInTheDocument();
  expect(screen.queryByText("OrganizationInformation")).toBeNull();
});

it("switches back to the Information tab", async () => {
  render(<OrganizationTabs organization={organization} />);
  await userEvent.click(screen.getByRole("button", { name: "Settings" }));
  await userEvent.click(screen.getByRole("button", { name: "Information" }));
  expect(screen.getByText("OrganizationInformation")).toBeInTheDocument();
});
