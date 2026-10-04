import { render, screen } from "@testing-library/react";
import OrganizationSettings from "./organization-settings";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("./sections/organization-info-section", () => function MockOrganizationInfoSection(props: any) {
  return <div>{`OrganizationInfoSection(${props.organization.id})`}</div>;
});
jest.mock("./sections/invite-settings-section", () => function MockInviteSettingsSection(props: any) {
  return <div>{`InviteSettingsSection(orgId=${props.orgId}, initialExpiration=${props.initialExpiration})`}</div>;
});
jest.mock("./sections/notification-settings-section", () => function MockNotificationSettingsSection(props: any) {
  return <div>{`NotificationSettingsSection(orgId=${props.orgId}, initialValue=${props.initialValue})`}</div>;
});
jest.mock("./sections/rules-section", () => function MockRulesSection() {
  return <div>RulesSection</div>;
});
jest.mock("./sections/organization-capacities", () => function MockCapacities() {
  return <div>Capacities</div>;
});
jest.mock("./sections/deactivate-organization-section", () => function MockDeactivateOrganizationSection(props: any) {
  return (
    <div>{`DeactivateOrganizationSection(orgId=${props.orgId}, name=${props.organizationName}, isActive=${props.initialIsActive})`}</div>
  );
});

const organization = {
  id: 6001,
  organizationName: "Acme Studio",
  settings: { inviteExpiration: 7, sendEmailNotif: true, isActive: true },
} as unknown as OrganizationDetail;

it("renders all settings sections wired with the organization's data", () => {
  render(<OrganizationSettings organization={organization} />);
  expect(screen.getByText("OrganizationInfoSection(6001)")).toBeInTheDocument();
  expect(
    screen.getByText("InviteSettingsSection(orgId=6001, initialExpiration=7)"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("NotificationSettingsSection(orgId=6001, initialValue=true)"),
  ).toBeInTheDocument();
  expect(screen.getByText("RulesSection")).toBeInTheDocument();
  expect(screen.getByText("Capacities")).toBeInTheDocument();
  expect(
    screen.getByText("DeactivateOrganizationSection(orgId=6001, name=Acme Studio, isActive=true)"),
  ).toBeInTheDocument();
});
