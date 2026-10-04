import {
  fetchTicketsPage,
  fetchAllTickets,
  fetchTicketCountNumbers,
  fetchPersonalTicketsPage,
  fetchAllPersonalTickets,
  fetchPersonalTicketCountNumbers,
  createPersonalTicket,
  fetchTicketById,
  createTicket,
  updateTicket,
  updateTicketTag,
  updateTicketAssignees,
  updateTicketStar,
  deleteTicket,
  uploadTicketAttachment,
  removeTicketAttachment,
  addTicketComment,
  updateTicketComment,
  removeTicketComment,
} from "./tickets";
import { api, ApiError } from "./client";
import type { RawTicket, RawPage } from "./raw-types";

jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return {
    ...actual,
    api: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      postForm: jest.fn(),
    },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

const RAW_TAG = {
  id: 1,
  orgId: 6001,
  tagName: "To Do",
  color: "#000",
  isDefault: true,
  isDeleted: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const RAW_TICKET: RawTicket = {
  id: 1,
  referenceId: "TCK-1",
  orgId: 6001,
  ownerId: null,
  projectId: null,
  project: null,
  title: "Fix the login page",
  description: null,
  attachments: [],
  tag: RAW_TAG,
  client: null,
  assignees: [],
  dueDate: null,
  starred: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as unknown as RawTicket;

const RAW_PAGE: RawPage<RawTicket> = {
  items: [RAW_TICKET],
  total: 1,
  page: 1,
  limit: 15,
};

beforeEach(() => jest.clearAllMocks());

describe("fetchTicketsPage", () => {
  it("builds the query string with only the provided fields", async () => {
    mockedApi.get.mockResolvedValue(RAW_PAGE);
    await fetchTicketsPage(6001, { page: 1, limit: 15 });
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/tickets?orgId=6001&page=1&limit=15",
    );
  });

  it("includes every optional filter when provided", async () => {
    mockedApi.get.mockResolvedValue(RAW_PAGE);
    await fetchTicketsPage(6001, {
      page: 2,
      limit: 30,
      search: "login",
      filterBy: [1, "overdue", "starred"],
      memberIds: [5, 6],
      projectIds: [9],
      dueDateFrom: "2026-01-01",
      dueDateTo: "2026-01-31",
      involvesUserId: 7,
    });
    const [path] = mockedApi.get.mock.calls[0];
    expect(path).toContain("search=login");
    expect(path).toContain("dueDateFrom=2026-01-01");
    expect(path).toContain("dueDateTo=2026-01-31");
    expect(path).toContain("involvesUserId=7");
    expect(path).toContain("filterBy=1");
    expect(path).toContain("filterBy=overdue");
    expect(path).toContain("filterBy=starred");
    expect(path).toContain("memberIds=5");
    expect(path).toContain("memberIds=6");
    expect(path).toContain("projectIds=9");
  });

  it("adapts every item in the returned page", async () => {
    mockedApi.get.mockResolvedValue(RAW_PAGE);
    const result = await fetchTicketsPage(6001, { page: 1, limit: 15 });
    expect(result.items[0].id).toBe(1);
    expect(result.total).toBe(1);
  });
});

describe("fetchAllTickets", () => {
  it("fetches without involvesUserId when omitted", async () => {
    mockedApi.get.mockResolvedValue([RAW_TICKET]);
    await fetchAllTickets(6001);
    expect(mockedApi.get).toHaveBeenCalledWith("/tickets/all?orgId=6001");
  });

  it("includes involvesUserId when provided", async () => {
    mockedApi.get.mockResolvedValue([RAW_TICKET]);
    await fetchAllTickets(6001, 7);
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/tickets/all?orgId=6001&involvesUserId=7",
    );
  });
});

describe("fetchTicketCountNumbers", () => {
  it("fetches with just orgId when no options given", async () => {
    mockedApi.get.mockResolvedValue({ totalTickets: 0, overdues: 0, onTime: 0, countPerTag: [] });
    await fetchTicketCountNumbers(6001);
    expect(mockedApi.get).toHaveBeenCalledWith("/tickets/count-numbers?orgId=6001");
  });

  it("includes filterBy/projectIds/involvesUserId when given", async () => {
    mockedApi.get.mockResolvedValue({ totalTickets: 0, overdues: 0, onTime: 0, countPerTag: [] });
    await fetchTicketCountNumbers(6001, {
      filterBy: ["overdue"],
      projectIds: [9],
      involvesUserId: 7,
    });
    const [path] = mockedApi.get.mock.calls[0];
    expect(path).toContain("involvesUserId=7");
    expect(path).toContain("filterBy=overdue");
    expect(path).toContain("projectIds=9");
  });
});

describe("fetchPersonalTicketsPage", () => {
  it("builds the personal query string", async () => {
    mockedApi.get.mockResolvedValue(RAW_PAGE);
    await fetchPersonalTicketsPage(1, { page: 1, limit: 15 });
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/tickets/personal?userId=1&page=1&limit=15",
    );
  });

  it("includes optional personal filters when provided", async () => {
    mockedApi.get.mockResolvedValue(RAW_PAGE);
    await fetchPersonalTicketsPage(1, {
      page: 1,
      limit: 15,
      search: "login",
      filterBy: ["starred"],
      dueDateFrom: "2026-01-01",
      dueDateTo: "2026-01-31",
    });
    const [path] = mockedApi.get.mock.calls[0];
    expect(path).toContain("search=login");
    expect(path).toContain("filterBy=starred");
    expect(path).toContain("dueDateFrom=2026-01-01");
    expect(path).toContain("dueDateTo=2026-01-31");
  });
});

describe("fetchAllPersonalTickets", () => {
  it("fetches by userId", async () => {
    mockedApi.get.mockResolvedValue([RAW_TICKET]);
    await fetchAllPersonalTickets(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/tickets/personal/all?userId=1");
  });
});

describe("fetchPersonalTicketCountNumbers", () => {
  it("fetches with just userId when no filterBy given", async () => {
    mockedApi.get.mockResolvedValue({ totalTickets: 0, overdues: 0, onTime: 0, countPerTag: [] });
    await fetchPersonalTicketCountNumbers(1);
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/tickets/personal/count-numbers?userId=1",
    );
  });

  it("includes filterBy when given", async () => {
    mockedApi.get.mockResolvedValue({ totalTickets: 0, overdues: 0, onTime: 0, countPerTag: [] });
    await fetchPersonalTicketCountNumbers(1, { filterBy: ["overdue"] });
    const [path] = mockedApi.get.mock.calls[0];
    expect(path).toContain("filterBy=overdue");
  });
});

describe("createPersonalTicket", () => {
  it("posts with the userId query param", async () => {
    mockedApi.post.mockResolvedValue(RAW_TICKET);
    const payload = { title: "Buy groceries", tagId: 1 };
    await createPersonalTicket(1, payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/tickets/personal?userId=1", payload);
  });
});

describe("fetchTicketById", () => {
  it("returns the adapted ticket on success", async () => {
    mockedApi.get.mockResolvedValue(RAW_TICKET);
    const ticket = await fetchTicketById(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/tickets/1");
    expect(ticket?.id).toBe(1);
  });

  it("returns null on 404/403", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(404, null));
    expect(await fetchTicketById(999)).toBeNull();
  });

  it("rethrows other errors", async () => {
    mockedApi.get.mockRejectedValue(new ApiError(500, null));
    await expect(fetchTicketById(1)).rejects.toThrow();
  });
});

describe("createTicket", () => {
  it("posts with the orgId query param", async () => {
    mockedApi.post.mockResolvedValue(RAW_TICKET);
    const payload = { title: "Fix the login page", tagId: 1 };
    await createTicket(6001, payload);
    expect(mockedApi.post).toHaveBeenCalledWith("/tickets?orgId=6001", payload);
  });
});

describe("updateTicket", () => {
  it("patches the given ticket id", async () => {
    mockedApi.patch.mockResolvedValue(RAW_TICKET);
    await updateTicket(1, { title: "Updated title" });
    expect(mockedApi.patch).toHaveBeenCalledWith("/tickets/1", { title: "Updated title" });
  });
});

describe("updateTicketTag", () => {
  it("patches the tag sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(RAW_TICKET);
    await updateTicketTag(1, 2);
    expect(mockedApi.patch).toHaveBeenCalledWith("/tickets/1/tag", { tagId: 2 });
  });
});

describe("updateTicketAssignees", () => {
  it("patches the assignees sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(RAW_TICKET);
    await updateTicketAssignees(1, [5, 6]);
    expect(mockedApi.patch).toHaveBeenCalledWith("/tickets/1/assignees", {
      assigneeIds: [5, 6],
    });
  });
});

describe("updateTicketStar", () => {
  it("patches the star sub-endpoint", async () => {
    mockedApi.patch.mockResolvedValue(RAW_TICKET);
    await updateTicketStar(1, true);
    expect(mockedApi.patch).toHaveBeenCalledWith("/tickets/1/star", { starred: true });
  });
});

describe("deleteTicket", () => {
  it("deletes the given ticket id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await deleteTicket(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/tickets/1");
  });
});

describe("uploadTicketAttachment", () => {
  it("posts a FormData with the file", async () => {
    mockedApi.postForm.mockResolvedValue({
      id: 1,
      name: "file.png",
      url: "/uploads/file.png",
      size: 100,
    });
    const file = new File(["x"], "file.png");
    const attachment = await uploadTicketAttachment(1, file);
    const [path, formData] = mockedApi.postForm.mock.calls[0];
    expect(path).toBe("/tickets/1/attachments");
    expect((formData as FormData).get("file")).toBe(file);
    expect(attachment.url).toBe("http://localhost:3001/uploads/file.png");
  });
});

describe("removeTicketAttachment", () => {
  it("deletes the given attachment", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await removeTicketAttachment(1, 2);
    expect(mockedApi.delete).toHaveBeenCalledWith("/tickets/1/attachments/2");
  });
});

describe("addTicketComment", () => {
  it("posts the comment text", async () => {
    mockedApi.post.mockResolvedValue({
      id: 1,
      ticketId: 1,
      userId: 1,
      comment: "Looks good",
      author: { id: 1, firstName: "Jane", lastName: "Doe", avatar: null },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await addTicketComment(1, "Looks good");
    expect(mockedApi.post).toHaveBeenCalledWith("/tickets/1/comments", {
      comment: "Looks good",
    });
  });
});

describe("updateTicketComment", () => {
  it("patches the given comment id", async () => {
    mockedApi.patch.mockResolvedValue({
      id: 1,
      ticketId: 1,
      userId: 1,
      comment: "Edited",
      author: { id: 1, firstName: "Jane", lastName: "Doe", avatar: null },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await updateTicketComment(1, "Edited");
    expect(mockedApi.patch).toHaveBeenCalledWith("/tickets/comments/1", {
      comment: "Edited",
    });
  });
});

describe("removeTicketComment", () => {
  it("deletes the given comment id", async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    await removeTicketComment(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/tickets/comments/1");
  });
});
