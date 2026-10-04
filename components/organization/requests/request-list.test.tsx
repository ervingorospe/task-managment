// Same isomorphic-dompurify ESM chain issue as lib/helper/render-description.test.ts.
jest.mock("isomorphic-dompurify", () => ({
  sanitize: (html: string, options?: { ALLOWED_TAGS?: string[] }) =>
    options?.ALLOWED_TAGS?.length === 0 ? html.replace(/<[^>]*>/g, "") : html,
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestList } from "./request-list";
import { useAuth } from "@/providers/auth-provider";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;

const CLIENT = { firstName: "Alex", lastName: "Kim" } as MemberDetail;

function request(overrides: Partial<TicketRequest> = {}): TicketRequest {
  return {
    id: 1,
    referenceId: "REQ-1",
    orgId: 6001,
    title: "Need a new laptop",
    attachments: [],
    client: CLIENT,
    ticketId: null,
    status: "pending",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderList(overrides: Partial<React.ComponentProps<typeof RequestList>> = {}) {
  const onApprove = jest.fn();
  const onReject = jest.fn();
  const onCancel = jest.fn();
  render(
    <RequestList
      requests={[request()]}
      canManage={false}
      canCancel={false}
      onApprove={onApprove}
      onReject={onReject}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onApprove, onReject, onCancel };
}

beforeEach(() => {
  mockedUseAuth.mockReturnValue({ activeOrganization: { settings: { timezone: "UTC" } } });
});

it("shows the default empty state with no requests", () => {
  renderList({ requests: [] });
  expect(screen.getByText("No requests yet")).toBeInTheDocument();
  expect(
    screen.getByText("Requests submitted by clients will show up here."),
  ).toBeInTheDocument();
});

it("shows a custom empty title, subtitle, and action", () => {
  renderList({
    requests: [],
    emptyTitle: "No matches",
    emptySubtitle: "Try a different filter.",
    emptyAction: <button>Clear filters</button>,
  });
  expect(screen.getByText("No matches")).toBeInTheDocument();
  expect(screen.getByText("Try a different filter.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
});

it("shows the reference id, title link, status, and requester", () => {
  renderList({ requests: [request({ id: 42, referenceId: "REQ-42" })] });
  expect(screen.getByText("REQ-42")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Need a new laptop" })).toHaveAttribute(
    "href",
    "/dashboard/requests/42",
  );
  expect(screen.getByText("Pending")).toBeInTheDocument();
  expect(screen.getByText(/Requested by Alex Kim/)).toBeInTheDocument();
});

it("shows the plain-text description", () => {
  renderList({ requests: [request({ description: "**Urgent** request" })] });
  expect(screen.getByText(/Urgent request/)).toBeInTheDocument();
});

it("shows no description block when there's none", () => {
  renderList({ requests: [request({ description: undefined })] });
  expect(screen.queryByText(/Urgent/)).toBeNull();
});

it("shows an attachment count when present", () => {
  renderList({
    requests: [request({ attachments: [{ id: 1, name: "a.png", url: "https://cdn/a.png", size: 100 }] })],
  });
  const attachmentSpan = document.querySelector(".lucide-paperclip")?.closest("span");
  expect(attachmentSpan).toHaveTextContent("1");
});

it("shows a 'View ticket' link for an approved request with a ticket", () => {
  renderList({ requests: [request({ status: "approved", ticketId: 7 })] });
  expect(screen.getByRole("link", { name: "View ticket" })).toHaveAttribute(
    "href",
    "/dashboard/tickets/7",
  );
});

it("shows no 'View ticket' link for an approved request without a ticket id", () => {
  renderList({ requests: [request({ status: "approved", ticketId: null })] });
  expect(screen.queryByRole("link", { name: "View ticket" })).toBeNull();
});

it("shows the rejection remarks for a rejected request", () => {
  renderList({ requests: [request({ status: "rejected", remarks: "Not enough detail" })] });
  expect(screen.getByText("Not enough detail")).toBeInTheDocument();
});

it("shows no remarks block for a rejected request without remarks", () => {
  renderList({ requests: [request({ status: "rejected", remarks: undefined })] });
  expect(screen.queryByText("Not enough detail")).toBeNull();
});

describe("manage actions", () => {
  it("shows Approve/Reject for a pending request when canManage", async () => {
    const { onApprove, onReject } = renderList({ canManage: true });
    await userEvent.click(screen.getByRole("button", { name: /Approve/ }));
    expect(onApprove).toHaveBeenCalledWith(request());

    await userEvent.click(screen.getByRole("button", { name: /Reject/ }));
    expect(onReject).toHaveBeenCalledWith(request());
  });

  it("hides manage actions without canManage", () => {
    renderList({ canManage: false });
    expect(screen.queryByRole("button", { name: /Approve/ })).toBeNull();
  });

  it("hides manage actions for a non-pending request even with canManage", () => {
    renderList({ canManage: true, requests: [request({ status: "approved" })] });
    expect(screen.queryByRole("button", { name: /Approve/ })).toBeNull();
  });
});

describe("cancel action", () => {
  it("shows Cancel for a pending request when canCancel", async () => {
    const { onCancel } = renderList({ canCancel: true });
    await userEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(onCancel).toHaveBeenCalledWith(request());
  });

  it("hides Cancel without canCancel", () => {
    renderList({ canCancel: false });
    expect(screen.queryByRole("button", { name: /Cancel/ })).toBeNull();
  });

  it("hides Cancel for a non-pending request even with canCancel", () => {
    renderList({ canCancel: true, requests: [request({ status: "cancelled" })] });
    expect(screen.queryByRole("button", { name: /Cancel/ })).toBeNull();
  });
});

it("works for a personal context with no active organization", () => {
  mockedUseAuth.mockReturnValue({ activeOrganization: null });
  renderList();
  expect(screen.getByText(/Requested by Alex Kim/)).toBeInTheDocument();
});
