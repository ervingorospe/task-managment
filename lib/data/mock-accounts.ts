import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { UserMembership } from "@/lib/types/user/user-membership.type";
import type { UserOrganization } from "@/lib/types/user/user-organization.type";
import type { OrgSettingsDetail } from "@/lib/types/organization/organization-settings.type";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { mockDefaultRoles } from "./default-roles";

const acmeSettings: OrgSettingsDetail = {
  id: 1,
  slug: "acme-studio",
  logo: "https://i.pravatar.cc/64?u=acme",
  timezone: "Asia/Manila",
  inviteExpiration: "1_day",
  sendEmailNotif: true,
  org_id: 1,
  isActive: true,
  isDeleted: false,
};

const acmeStudio: UserOrganization = {
  id: 1,
  organization_name: "Acme Studio",
  organization_desc: "A small studio building tools for independent creators.",
  email: "hello@acmestudio.com",
  website: "https://acmestudio.com",
  owner_id: 1,
  settings: acmeSettings,
};

// Acme Studio's own instantiated copies of the default role templates —
// same org_id:null (template) vs org_id:set (usable) distinction used
// throughout the rest of the mock data.
function instantiateRole(templateId: number, orgRoleId: number): RoleDetail {
  const template = mockDefaultRoles.find((r) => r.id === templateId);
  if (!template) throw new Error(`Unknown role template id: ${templateId}`);
  return { ...template, id: orgRoleId, org_id: 1 };
}

const superadminRole = instantiateRole(1, 101);
const adminRole = instantiateRole(4, 104);
const memberRole = instantiateRole(3, 103);
const clientRole = instantiateRole(2, 102);

function membership(id: number, role: RoleDetail): UserMembership {
  return { id, role, organization: acmeStudio };
}

interface MockAccount {
  email: string;
  password: string;
  user: CurrentUser;
}

export const mockAccounts: MockAccount[] = [
  {
    email: "erv@g.com",
    password: "123",
    user: {
      id: 1,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=jane",
      account_type: "owner",
      isActive: true,
      memberships: [membership(1, superadminRole)],
    },
  },
  {
    email: "admin@g.com",
    password: "123",
    user: {
      id: 2,
      first_name: "Marco",
      last_name: "Cruz",
      email: "marco@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=marco",
      account_type: "member",
      isActive: true,
      memberships: [membership(2, adminRole)],
    },
  },
  {
    email: "priya@acmestudio.com",
    password: "123",
    user: {
      id: 3,
      first_name: "Priya",
      last_name: "Nair",
      email: "priya@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=priya",
      account_type: "member",
      isActive: true,
      memberships: [membership(3, memberRole)],
    },
  },
  {
    email: "alex@clientco.com",
    password: "123",
    user: {
      id: 4,
      first_name: "Alex",
      last_name: "Rivera",
      email: "alex@clientco.com",
      avatar: "https://i.pravatar.cc/64?u=alex",
      account_type: "member",
      isActive: true,
      memberships: [membership(4, clientRole)],
    },
  },
];
