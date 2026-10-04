import { render, screen } from "@testing-library/react";
import OrganizationInformation from "./organization-information";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/components/organization/own/panels/sections/basic-info-section", () => function MockBasicInformation() {
  return <div>BasicInformation</div>;
});
jest.mock("@/components/organization/own/panels/sections/roles-section", () => function MockRolesSection(props: any) {
  return <div>{`RolesSection(orgId=${props.orgId}, capacity=${props.capacity})`}</div>;
});
jest.mock("@/components/organization/own/panels/sections/tags-section", () => function MockTagsSection(props: any) {
  return <div>{`TagsSection(orgId=${props.orgId}, capacity=${props.capacity})`}</div>;
});

const mockedUseAuth = useAuth as jest.Mock;

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: { rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })) },
    },
    isPersonalMode: false,
  });
}

const organization = {
  id: 6001,
  roles: [],
  tags: [],
  capacity: { roles: 5, tags: 5, members: 10, tickets: 10, projects: 10 },
} as unknown as OrganizationDetail;

it("always shows basic information", () => {
  withPermissions([]);
  render(<OrganizationInformation organization={organization} />);
  expect(screen.getByText("BasicInformation")).toBeInTheDocument();
  expect(screen.queryByText(/RolesSection/)).toBeNull();
  expect(screen.queryByText(/TagsSection/)).toBeNull();
});

it("shows roles and tags sections when permitted, wiring orgId and capacity", () => {
  withPermissions([PERMISSIONS.ROLE_VIEW, PERMISSIONS.TAG_VIEW]);
  render(<OrganizationInformation organization={organization} />);
  expect(screen.getByText("RolesSection(orgId=6001, capacity=5)")).toBeInTheDocument();
  expect(screen.getByText("TagsSection(orgId=6001, capacity=5)")).toBeInTheDocument();
});
