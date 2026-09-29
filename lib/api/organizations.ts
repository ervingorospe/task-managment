import { api, isNotFoundOrForbidden } from "./client";
import type { CreateOrganizationPayload } from "@/lib/types/organization/create-organization-payload.type";
import {
  adaptUser,
  adaptRole,
  adaptTag,
  adaptProject,
  adaptMember,
  adaptSettings,
  adaptInvite,
  adaptTicket,
  adaptTicketRequest,
} from "./adapters";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type {
  RawOrganization,
  RawPage,
  RawProject,
  RawTicket,
  RawTicketRequest,
} from "./raw-types";

function adaptOrganizationBase(
  org: RawOrganization,
): Omit<OrganizationDetail, "tickets" | "ticketRequests" | "projects"> {
  return {
    id: org.id,
    organizationName: org.organizationName,
    organizationDesc: org.organizationDesc ?? undefined,
    email: org.email ?? undefined,
    website: org.website ?? undefined,
    ownerId: org.owner.id,
    settings: adaptSettings(org.settings),
    capacity: org.capacity,
    owner: adaptUser(org.owner),
    roles: org.roles.map(adaptRole),
    tags: org.tags.map(adaptTag),
    members: org.members.map(adaptMember),
    pendingInvites: (org.pendingInvites ?? []).map(adaptInvite),
    pendingOwnershipTransfer: org.pendingOwnershipTransfer
      ? adaptInvite(org.pendingOwnershipTransfer)
      : undefined,
  };
}

/**
 * Fetches the organization by slug plus its tickets/requests (separate
 * endpoints on the backend) and composes them into the same
 * `OrganizationDetail` shape the mock data used to return in one object —
 * so every component that already reads `organization.tickets` /
 * `organization.ticketRequests` keeps working unchanged.
 *
 * The high `limit` below is a deliberate stopgap: it fetches "everything"
 * in one page rather than the real paginated list, since most call sites
 * still expect a full in-memory array to filter/paginate client-side (the
 * same pattern the mock data used). Fine for this org's current size;
 * revisit once those call sites are migrated to the paginated endpoints
 * directly.
 */
export async function fetchOrganizationDetailBySlug(
  slug: string,
): Promise<OrganizationDetail | null> {
  return composeOrganizationDetail(() =>
    api.get<RawOrganization>(`/organizations/${slug}`),
  );
}

export async function fetchOrganizationDetailById(
  orgId: number,
): Promise<OrganizationDetail | null> {
  return composeOrganizationDetail(() =>
    api.get<RawOrganization>(`/organizations/by-id/${orgId}`),
  );
}

export async function createOrganization(
  payload: CreateOrganizationPayload,
): Promise<OrganizationDetail> {
  const org = await api.post<RawOrganization>("/organizations", payload);
  return {
    ...adaptOrganizationBase(org),
    tickets: [],
    ticketRequests: [],
    projects: [],
  };
}

export interface OwnedOrganization {
  id: number;
  organizationName: string;
  organizationDesc?: string;
  slug: string;
}

export async function fetchMyOwnOrganizations(
  ownerId: number,
): Promise<OwnedOrganization[]> {
  return api.get<OwnedOrganization[]>(
    `/organizations/my-own-organizations?ownerId=${ownerId}`,
  );
}

export async function updateOrganizationBasicInfo(
  orgId: number,
  patch: {
    organizationName?: string;
    email?: string;
    website?: string;
    organizationDesc?: string;
  },
): Promise<void> {
  await api.patch(`/organizations/${orgId}/basic-info`, patch);
}

export async function uploadOrganizationLogo(
  orgId: number,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await api.postForm<{ url: string }>(
    `/organizations/${orgId}/logo`,
    formData,
  );
  return result.url;
}

// Split into one call per field, matching the backend's split settings
// endpoints (each carries its own Rule — see organization.controller.ts).
export async function updateOrganizationTimezone(
  orgId: number,
  timezone: string,
): Promise<void> {
  await api.patch(`/organizations/${orgId}/settings/timezone`, { timezone });
}

export async function updateOrganizationInviteExpiration(
  orgId: number,
  inviteExpiration: string,
): Promise<void> {
  await api.patch(`/organizations/${orgId}/settings/invite-expiration`, {
    inviteExpiration,
  });
}

export async function updateOrganizationNotifications(
  orgId: number,
  sendEmailNotif: boolean,
): Promise<void> {
  await api.patch(`/organizations/${orgId}/settings/notifications`, {
    sendEmailNotif,
  });
}

export async function updateOrganizationActiveState(
  orgId: number,
  isActive: boolean,
): Promise<void> {
  await api.patch(`/organizations/${orgId}/active-state`, { isActive });
}

export async function deleteOrganization(orgId: number): Promise<void> {
  await api.delete(`/organizations/${orgId}`);
}

export async function requestOwnershipTransfer(
  orgId: number,
  email: string,
): Promise<void> {
  await api.post(`/organizations/${orgId}/ownership-transfer`, { email });
}

export async function cancelOwnershipTransfer(orgId: number): Promise<void> {
  await api.delete(`/organizations/${orgId}/ownership-transfer`);
}

async function composeOrganizationDetail(
  fetchOrg: () => Promise<RawOrganization>,
): Promise<OrganizationDetail | null> {
  let org: RawOrganization;
  try {
    org = await fetchOrg();
  } catch (error) {
    if (isNotFoundOrForbidden(error)) return null;
    throw error;
  }

  // A caller can be a genuine member (passed the check above) while still
  // lacking any ticket-view permission in their role — a 403 here means
  // "nothing to show", not "the org doesn't exist", so it degrades to an
  // empty list instead of failing the whole page like the org fetch above.
  const emptyPage = { items: [], total: 0, page: 1, limit: 100 };
  async function fetchOrEmpty<T>(path: string): Promise<RawPage<T>> {
    try {
      return await api.get<RawPage<T>>(path);
    } catch (error) {
      if (isNotFoundOrForbidden(error)) return emptyPage;
      throw error;
    }
  }

  // Same 403-degrades-to-empty reasoning as fetchOrEmpty above, for an
  // endpoint that returns a plain array rather than a page.
  async function fetchArrayOrEmpty<T>(path: string): Promise<T[]> {
    try {
      return await api.get<T[]>(path);
    } catch (error) {
      if (isNotFoundOrForbidden(error)) return [];
      throw error;
    }
  }

  // 100 is the backend's own max page size (PaginationQueryDto). Fine for
  // this org's current size — see this function's own doc comment above.
  const [ticketsPage, requestsPage, projects] = await Promise.all([
    fetchOrEmpty<RawTicket>(`/tickets?orgId=${org.id}&limit=100`),
    fetchOrEmpty<RawTicketRequest>(
      `/ticket-requests?orgId=${org.id}&limit=100`,
    ),
    // Not paginated (see project.service.ts) — already server-scoped to
    // whatever this caller can see (project.view vs project.view.own), so
    // no involvesUserId-style query param to pass here.
    fetchArrayOrEmpty<RawProject>(`/projects?orgId=${org.id}`),
  ]);

  return {
    ...adaptOrganizationBase(org),
    tickets: ticketsPage.items.map(adaptTicket),
    ticketRequests: requestsPage.items.map(adaptTicketRequest),
    projects: projects.map(adaptProject),
  };
}
