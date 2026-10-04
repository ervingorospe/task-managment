import { getOrganizationBySlug, getTicketById, getTicketRequestById } from "./organization-detail";
import { fetchOrganizationDetailBySlug, fetchOrganizationDetailById } from "@/lib/api/organizations";
import { fetchTicketById } from "@/lib/api/tickets";
import { fetchTicketRequestById } from "@/lib/api/ticket-requests";

jest.mock("@/lib/api/organizations", () => ({
  fetchOrganizationDetailBySlug: jest.fn(),
  fetchOrganizationDetailById: jest.fn(),
}));
jest.mock("@/lib/api/tickets", () => ({ fetchTicketById: jest.fn() }));
jest.mock("@/lib/api/ticket-requests", () => ({ fetchTicketRequestById: jest.fn() }));

const mockedFetchBySlug = fetchOrganizationDetailBySlug as jest.Mock;
const mockedFetchById = fetchOrganizationDetailById as jest.Mock;
const mockedFetchTicketById = fetchTicketById as jest.Mock;
const mockedFetchTicketRequestById = fetchTicketRequestById as jest.Mock;

const ORG = { id: 6001, organizationName: "Acme Studio" };

beforeEach(() => jest.clearAllMocks());

describe("getOrganizationBySlug", () => {
  it("passes through the org fetch result", async () => {
    mockedFetchBySlug.mockResolvedValue(ORG);
    expect(await getOrganizationBySlug("acme-studio")).toBe(ORG);
    expect(mockedFetchBySlug).toHaveBeenCalledWith("acme-studio");
  });

  it("passes through null when the org doesn't exist", async () => {
    mockedFetchBySlug.mockResolvedValue(null);
    expect(await getOrganizationBySlug("nonexistent")).toBeNull();
  });
});

describe("getTicketById", () => {
  it("returns null when the ticket doesn't exist", async () => {
    mockedFetchTicketById.mockResolvedValue(null);
    expect(await getTicketById(1)).toBeNull();
    expect(mockedFetchById).not.toHaveBeenCalled();
  });

  it("returns a null organization for a personal (org-less) ticket", async () => {
    mockedFetchTicketById.mockResolvedValue({ id: 1, orgId: null });
    const result = await getTicketById(1);
    expect(result).toEqual({ ticket: { id: 1, orgId: null }, organization: null });
    expect(mockedFetchById).not.toHaveBeenCalled();
  });

  it("fetches and returns the organization for an org ticket", async () => {
    mockedFetchTicketById.mockResolvedValue({ id: 1, orgId: 6001 });
    mockedFetchById.mockResolvedValue(ORG);
    const result = await getTicketById(1);
    expect(mockedFetchById).toHaveBeenCalledWith(6001);
    expect(result).toEqual({ ticket: { id: 1, orgId: 6001 }, organization: ORG });
  });

  it("returns null when the ticket's organization can't be found", async () => {
    mockedFetchTicketById.mockResolvedValue({ id: 1, orgId: 6001 });
    mockedFetchById.mockResolvedValue(null);
    expect(await getTicketById(1)).toBeNull();
  });
});

describe("getTicketRequestById", () => {
  it("returns null when the request doesn't exist", async () => {
    mockedFetchTicketRequestById.mockResolvedValue(null);
    expect(await getTicketRequestById(1)).toBeNull();
    expect(mockedFetchById).not.toHaveBeenCalled();
  });

  it("fetches and returns the organization for the request", async () => {
    mockedFetchTicketRequestById.mockResolvedValue({ id: 1, orgId: 6001 });
    mockedFetchById.mockResolvedValue(ORG);
    const result = await getTicketRequestById(1);
    expect(mockedFetchById).toHaveBeenCalledWith(6001);
    expect(result).toEqual({ request: { id: 1, orgId: 6001 }, organization: ORG });
  });

  it("returns null when the request's organization can't be found", async () => {
    mockedFetchTicketRequestById.mockResolvedValue({ id: 1, orgId: 6001 });
    mockedFetchById.mockResolvedValue(null);
    expect(await getTicketRequestById(1)).toBeNull();
  });
});
