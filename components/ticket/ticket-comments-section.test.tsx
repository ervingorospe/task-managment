jest.mock("@/lib/helper/mentionable-members", () => ({ getMentionableMembers: jest.fn() }));

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketCommentsSection from "./ticket-comments-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { addTicketComment, updateTicketComment, removeTicketComment } from "@/lib/api/tickets";
import { getMentionableMembers } from "@/lib/helper/mentionable-members";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/hooks/use-log-activity", () => ({ useLogActivity: jest.fn() }));
jest.mock("@/lib/api/tickets", () => ({
  addTicketComment: jest.fn(),
  updateTicketComment: jest.fn(),
  removeTicketComment: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUseLogActivity = useLogActivity as jest.Mock;
const mockedAddComment = addTicketComment as jest.Mock;
const mockedUpdateComment = updateTicketComment as jest.Mock;
const mockedRemoveComment = removeTicketComment as jest.Mock;
const mockedGetMentionableMembers = getMentionableMembers as jest.Mock;

const toast = jest.fn();
const logActivity = jest.fn();

const CURRENT_USER = { id: 1, firstName: "Jane", lastName: "Doe", avatar: null };

function member(overrides: Partial<MemberDetail> = {}): MemberDetail {
  const base = {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    orgId: 6001,
    roleId: 1,
    isActive: true,
    ...overrides,
  };
  return {
    ...base,
    user: { id: base.id, firstName: base.firstName, lastName: base.lastName, email: base.email } as MemberDetail["user"],
  };
}

const JANE = member({ id: 1, firstName: "Jane", lastName: "Doe" });
const MARCO = member({ id: 2, firstName: "Marco", lastName: "Reyes" });

function org(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 6001,
    organizationName: "Acme Studio",
    ownerId: 1,
    settings: { timezone: "UTC" } as OrganizationDetail["settings"],
    capacity: {} as OrganizationDetail["capacity"],
    owner: {} as OrganizationDetail["owner"],
    roles: [],
    tags: [],
    projects: [],
    members: [JANE, MARCO],
    tickets: [],
    ticketRequests: [],
    ...overrides,
  } as OrganizationDetail;
}

function comment(overrides: Partial<TicketComment> = {}): TicketComment {
  return {
    id: 1,
    ticketId: 1,
    userId: 1,
    comment: "This is a comment",
    author: { id: 1, firstName: "Jane", lastName: "Doe", avatar: null },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue({ currentUser: CURRENT_USER });
  mockedUseToast.mockReturnValue(toast);
  mockedUseLogActivity.mockReturnValue(logActivity);
  mockedGetMentionableMembers.mockReturnValue([JANE, MARCO]);
});

function renderSection(overrides: Partial<React.ComponentProps<typeof TicketCommentsSection>> = {}) {
  render(
    <TicketCommentsSection
      ticketId={1}
      ticketTitle="Fix the login page"
      referenceId="TCK-1"
      comments={[]}
      client={null}
      assignees={[]}
      organization={org()}
      {...overrides}
    />,
  );
}

it("shows no count badge and no list when there are no comments", () => {
  renderSection();
  expect(screen.getByText("Comments")).toBeInTheDocument();
  expect(screen.queryByText(/^\(\d+\)$/)).toBeNull();
  expect(screen.queryByRole("listitem")).toBeNull();
});

it("lists comments with author name, timestamp, and a count badge", () => {
  renderSection({
    comments: [comment({ comment: "First comment" }), comment({ id: 2, comment: "Second comment" })],
  });
  expect(screen.getByText("(2)")).toBeInTheDocument();
  expect(screen.getAllByText("Jane Doe").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText("First comment")).toBeInTheDocument();
  expect(screen.getByText("Second comment")).toBeInTheDocument();
});

it("marks an edited comment with '(edited)'", () => {
  renderSection({
    comments: [comment({ createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" })],
  });
  expect(screen.getByText(/\(edited\)/)).toBeInTheDocument();
});

it("does not show Edit/Remove for a comment from a different author", () => {
  renderSection({ comments: [comment({ userId: 2 })] });
  expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
});

it("hides the compose box when there's no current user", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null });
  renderSection();
  expect(screen.queryByPlaceholderText(/Leave a comment/)).toBeNull();
});

it("does not call getMentionableMembers for a personal (org-less) ticket", () => {
  renderSection({ organization: null });
  expect(mockedGetMentionableMembers).not.toHaveBeenCalled();
});

it("defaults to an empty list when the comments prop is omitted", () => {
  render(
    <TicketCommentsSection
      ticketId={1}
      ticketTitle="Fix the login page"
      referenceId="TCK-1"
      client={null}
      assignees={[]}
      organization={org()}
    />,
  );
  expect(screen.queryByRole("listitem")).toBeNull();
});

describe("posting a comment", () => {
  it("disables Comment until there's text, then posts, appends, and logs activity", async () => {
    const newComment = comment({ id: 5, comment: "New comment" });
    mockedAddComment.mockResolvedValue(newComment);
    renderSection({ client: MARCO, assignees: [JANE] });

    const commentButton = screen.getByRole("button", { name: "Comment" });
    expect(commentButton).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText(/Leave a comment/), "New comment");
    expect(commentButton).toBeEnabled();
    await userEvent.click(commentButton);

    expect(mockedAddComment).toHaveBeenCalledWith(1, "New comment");
    expect(await screen.findByText("New comment")).toBeInTheDocument();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "commented" }),
    );
    expect(screen.getByPlaceholderText(/Leave a comment/)).toHaveValue("");
  });

  it("does not post whitespace-only text", async () => {
    renderSection();
    await userEvent.type(screen.getByPlaceholderText(/Leave a comment/), "   ");
    expect(screen.getByRole("button", { name: "Comment" })).toBeDisabled();
  });

  it("toasts and does not add anything when posting fails", async () => {
    mockedAddComment.mockRejectedValue(new Error("boom"));
    renderSection();
    await userEvent.type(screen.getByPlaceholderText(/Leave a comment/), "New comment");
    await userEvent.click(screen.getByRole("button", { name: "Comment" }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to add comment", "error"));
    expect(logActivity).not.toHaveBeenCalled();
    expect(screen.queryByText("New comment")).toBeNull();
  });

  it("passes undefined orgId for a personal (org-less) ticket", async () => {
    mockedAddComment.mockResolvedValue(comment({ id: 5 }));
    renderSection({ organization: null });
    await userEvent.type(screen.getByPlaceholderText(/Leave a comment/), "New comment");
    await userEvent.click(screen.getByRole("button", { name: "Comment" }));

    await waitFor(() =>
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ orgId: undefined })),
    );
  });
});

describe("editing a comment", () => {
  it("enters edit mode with the current text prefilled", async () => {
    renderSection({ comments: [comment({ comment: "Original text" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByDisplayValue("Original text")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("cancels editing without saving", async () => {
    renderSection({ comments: [comment({ comment: "Original text" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const textarea = screen.getByDisplayValue("Original text");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Changed text");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Original text")).toBeInTheDocument();
    expect(mockedUpdateComment).not.toHaveBeenCalled();
  });

  it("disables Save until there's text", async () => {
    renderSection({ comments: [comment({ comment: "Original text" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const textarea = screen.getByDisplayValue("Original text");
    await userEvent.clear(textarea);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves the edit, marks it edited, and logs activity", async () => {
    mockedUpdateComment.mockResolvedValue(undefined);
    renderSection({
      comments: [
        comment({ id: 7, comment: "Original text" }),
        comment({ id: 8, userId: 2, comment: "Someone else's comment" }),
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const textarea = screen.getByDisplayValue("Original text");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Updated text");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockedUpdateComment).toHaveBeenCalledWith(7, "Updated text"));
    expect(await screen.findByText("Updated text")).toBeInTheDocument();
    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "comment_edited" }),
    );
    expect(screen.getByText("Someone else's comment")).toBeInTheDocument();
  });

  it("toasts and leaves the original text when saving fails", async () => {
    mockedUpdateComment.mockRejectedValue(new Error("boom"));
    renderSection({ comments: [comment({ comment: "Original text" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const textarea = screen.getByDisplayValue("Original text");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Updated text");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to update comment", "error"));
    expect(screen.getByText("Original text")).toBeInTheDocument();
  });
});

describe("deleting a comment", () => {
  it("opens a confirm dialog and deletes on confirm, logging activity", async () => {
    mockedRemoveComment.mockResolvedValue(undefined);
    renderSection({ comments: [comment({ id: 9, comment: "Doomed comment" })] });
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("Delete comment")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockedRemoveComment).toHaveBeenCalledWith(9));
    expect(screen.queryByText("Doomed comment")).toBeNull();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 6001, action: "comment_removed" }),
    );
  });

  it("closes without deleting on cancel", async () => {
    renderSection({ comments: [comment({ comment: "Safe comment" })] });
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedRemoveComment).not.toHaveBeenCalled();
    expect(screen.getByText("Safe comment")).toBeInTheDocument();
  });

  it("toasts and keeps the comment when deletion fails", async () => {
    mockedRemoveComment.mockRejectedValue(new Error("boom"));
    renderSection({ comments: [comment({ comment: "Sticky comment" })] });
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("Failed to remove comment", "error"));
    expect(screen.getByText("Sticky comment")).toBeInTheDocument();
  });
});

describe("@mentions", () => {
  it("shows mention suggestions while composing and inserts the selection", async () => {
    renderSection();
    const textarea = screen.getByPlaceholderText(/Leave a comment/);
    await userEvent.type(textarea, "Hey @ja");

    expect(await screen.findByRole("button", { name: /Jane Doe/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Jane Doe/ }));

    expect(textarea).toHaveValue("Hey @Jane Doe ");
    expect(screen.queryByRole("button", { name: /Jane Doe/ })).toBeNull();
  });

  it("filters mention suggestions by the typed query", async () => {
    renderSection();
    await userEvent.type(screen.getByPlaceholderText(/Leave a comment/), "Hey @mar");
    expect(await screen.findByRole("button", { name: /Marco Reyes/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Jane Doe/ })).toBeNull();
  });

  it("shows a mention suggestion for a member whose user account was removed from the org", async () => {
    const removedUserMember: MemberDetail = { ...member({ id: 3, firstName: "Removed", lastName: "Person" }), user: null };
    mockedGetMentionableMembers.mockReturnValue([JANE, MARCO, removedUserMember]);
    renderSection();
    await userEvent.type(screen.getByPlaceholderText(/Leave a comment/), "Hey @remo");
    expect(await screen.findByRole("button", { name: /Removed Person/ })).toBeInTheDocument();
  });

  it("shows no suggestion panel once the query matches nobody", async () => {
    renderSection();
    await userEvent.type(screen.getByPlaceholderText(/Leave a comment/), "Hey @zzz");
    expect(screen.queryByRole("button", { name: /Jane Doe/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Marco Reyes/ })).toBeNull();
  });

  it("shows mention suggestions while editing, scoped to that comment", async () => {
    renderSection({ comments: [comment({ comment: "Original text" })] });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const textarea = screen.getByDisplayValue("Original text");
    await userEvent.type(textarea, " @mar");

    await userEvent.click(await screen.findByRole("button", { name: /Marco Reyes/ }));
    expect(textarea).toHaveValue("Original text @Marco Reyes ");
  });

  it("closes the suggestions once continued typing breaks the @mention pattern", async () => {
    renderSection();
    const textarea = screen.getByPlaceholderText(/Leave a comment/);
    await userEvent.type(textarea, "Hey @ja");
    expect(await screen.findByRole("button", { name: /Jane Doe/ })).toBeInTheDocument();

    await userEvent.type(textarea, " thanks");
    expect(screen.queryByRole("button", { name: /Jane Doe/ })).toBeNull();
  });

  it("highlights a mention inside rendered comment text", () => {
    renderSection({ comments: [comment({ comment: "Hey @Jane Doe, take a look" })] });
    expect(screen.getByText("@Jane Doe")).toHaveClass("font-medium");
  });
});
