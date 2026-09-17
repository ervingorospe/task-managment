// to be remove

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
  orgId: 1,
  isActive: true,
  isDeleted: false,
};

const acmeSettings2: OrgSettingsDetail = {
  id: 2,
  slug: "acme-studio2",
  logo: "https://i.pravatar.cc/64?u=acme",
  timezone: "Asia/Manila",
  inviteExpiration: "1_day",
  sendEmailNotif: true,
  orgId: 1,
  isActive: true,
  isDeleted: false,
};

const acmeStudio: UserOrganization = {
  id: 1,
  organizationName: "Acme Studio",
  organizationDesc: "A small studio building tools for independent creators.",
  email: "hello@acmestudio.com",
  website: "https://acmestudio.com",
  ownerId: 1,
  settings: acmeSettings,
};

const acmeStudio2: UserOrganization = {
  id: 2,
  organizationName: "Acme Studio2",
  organizationDesc: "A small studio building tools for independent creators.",
  email: "hello@acmestudio.com",
  website: "https://acmestudio.com",
  ownerId: 1,
  settings: acmeSettings2,
};

// Acme Studio's own instantiated copies of the default role templates —
// same orgId:null (template) vs orgId:set (usable) distinction used
// throughout the rest of the mock data.
function instantiateRole(templateId: number, orgRoleId: number): RoleDetail {
  const template = mockDefaultRoles.find((r) => r.id === templateId);
  if (!template) throw new Error(`Unknown role template id: ${templateId}`);
  return { ...template, id: orgRoleId, orgId: 1 };
}

const superadminRole = instantiateRole(1, 101);
const adminRole = instantiateRole(4, 104);
const memberRole = instantiateRole(3, 103);
const clientRole = instantiateRole(2, 102);

function membership(
  id: number,
  role: RoleDetail,
  organization = acmeStudio,
): UserMembership {
  return { id, role, organization };
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
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=jane",
      accountType: "owner",
      isActive: true,
      memberships: [
        membership(1, superadminRole),
        membership(1, superadminRole, acmeStudio2),
      ],
    },
  },
  {
    email: "admin@g.com",
    password: "123",
    user: {
      id: 2,
      firstName: "Marco",
      lastName: "Cruz",
      email: "marco@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=marco",
      accountType: "member",
      isActive: true,
      memberships: [membership(2, adminRole)],
    },
  },
  {
    email: "mem@g.com",
    password: "123",
    user: {
      id: 3,
      firstName: "Priya",
      lastName: "Nair",
      email: "priya@acmestudio.com",
      avatar: "https://i.pravatar.cc/64?u=priya",
      accountType: "member",
      isActive: true,
      memberships: [membership(3, memberRole)],
    },
  },
  {
    email: "cl@g.com",
    password: "123",
    user: {
      id: 4,
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex@clientco.com",
      avatar: "https://i.pravatar.cc/64?u=alex",
      accountType: "member",
      isActive: true,
      memberships: [membership(4, clientRole)],
    },
  },
];
