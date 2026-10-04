import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TicketFilterDropdown,
  emptyTicketFilter,
  type TicketFilterState,
} from "./ticket-filter-dropdown";
import { usePermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, usePermission: jest.fn() };
});

const mockedUsePermission = usePermission as jest.Mock;

const TODO: TagDetail = { id: 1, tagName: "To Do", color: "#000", isDefault: true, isDeleted: false };
const DONE: TagDetail = { id: 2, tagName: "Done", color: "#0F0", isDefault: false, isDeleted: false };

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

async function openFilter() {
  const trigger = screen
    .getAllByRole("button", { name: /Filter/ })
    .find((el) => el.tagName === "BUTTON")!;
  await userEvent.click(trigger);
}

function renderDropdown(overrides: Partial<React.ComponentProps<typeof TicketFilterDropdown>> = {}) {
  const onChange = jest.fn();
  render(
    <TicketFilterDropdown
      value={emptyTicketFilter}
      onChange={onChange}
      members={[JANE, MARCO]}
      tags={[TODO, DONE]}
      {...overrides}
    />,
  );
  return { onChange };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUsePermission.mockReturnValue(true);
});

it("shows no active-count badge when the filter is empty", () => {
  renderDropdown();
  expect(screen.queryByText(/^\d+$/)).toBeNull();
});

it("shows the active-count badge summing all active criteria", () => {
  const filter: TicketFilterState = {
    memberIds: [1, 2],
    tagIds: [1],
    dateFrom: "2026-01-01",
    dateTo: "2026-01-31",
    overdueOnly: true,
  };
  renderDropdown({ value: filter });
  expect(screen.getByText("6")).toBeInTheDocument();
});

describe("member filter visibility", () => {
  it("shows the Members section when the user can assign", async () => {
    mockedUsePermission.mockReturnValue(true);
    renderDropdown();
    await openFilter();
    expect(screen.getByText("Members")).toBeInTheDocument();
  });

  it("hides the Members section without ticket.assign", async () => {
    mockedUsePermission.mockReturnValue(false);
    renderDropdown();
    await openFilter();
    expect(screen.queryByText("Members")).toBeNull();
  });

  it("hides the Members section when hideMemberFilter is set even with permission", async () => {
    mockedUsePermission.mockReturnValue(true);
    renderDropdown({ hideMemberFilter: true });
    await openFilter();
    expect(screen.queryByText("Members")).toBeNull();
  });
});

describe("members", () => {
  it("lists members and toggles selection in the draft without applying", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("Jane Doe"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Jane Doe")).toBeChecked();
  });

  it("unchecks an already-selected member", async () => {
    renderDropdown({ value: { ...emptyTicketFilter, memberIds: [1] } });
    await openFilter();
    const checkbox = screen.getByLabelText("Jane Doe");
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("filters members by search text", async () => {
    renderDropdown();
    await openFilter();
    await userEvent.type(screen.getByPlaceholderText("Search members"), "marco");
    expect(screen.getByLabelText("Marco Reyes")).toBeInTheDocument();
    expect(screen.queryByLabelText("Jane Doe")).toBeNull();
  });

  it("lists a member whose user account was removed from the org, with a blank label", async () => {
    // No fallback to the member's own firstName/lastName — the checkbox
    // label is built strictly from `member.user`, so a removed user's
    // account shows up with an empty name rather than crashing.
    const removedUserMember: MemberDetail = { ...member({ id: 3, firstName: "Removed", lastName: "Person" }), user: null };
    renderDropdown({ members: [JANE, MARCO, removedUserMember] });
    await openFilter();
    expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByLabelText("Marco Reyes")).toBeInTheDocument();
  });

  it("shows 'No members found' when the search matches nothing", async () => {
    renderDropdown();
    await openFilter();
    await userEvent.type(screen.getByPlaceholderText("Search members"), "zzz");
    expect(screen.getByText("No members found")).toBeInTheDocument();
  });

  it("caps the visible member list and shows a 'more' hint beyond 10", async () => {
    const members = Array.from({ length: 12 }, (_, i) =>
      member({ id: i + 1, firstName: `Member${i + 1}`, lastName: "Test" }),
    );
    renderDropdown({ members });
    await openFilter();
    expect(screen.getByText(/\+2 more/)).toBeInTheDocument();
  });
});

describe("tags", () => {
  it("lists tags and toggles selection in the draft", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("To Do"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("To Do")).toBeChecked();
  });

  it("unchecks an already-selected tag", async () => {
    renderDropdown({ value: { ...emptyTicketFilter, tagIds: [1] } });
    await openFilter();
    const checkbox = screen.getByLabelText("To Do");
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("shows 'No tags found' when there are none", async () => {
    renderDropdown({ tags: [] });
    await openFilter();
    expect(screen.getByText("No tags found")).toBeInTheDocument();
  });
});

describe("overdue and due date range", () => {
  it("toggles the overdue-only checkbox", async () => {
    renderDropdown();
    await openFilter();
    const checkbox = screen.getByLabelText("Overdue only");
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("sets a due date range", async () => {
    renderDropdown();
    await openFilter();
    const [fromInput, toInput] = document.querySelectorAll('input[type="date"]');
    await userEvent.type(fromInput as HTMLInputElement, "2026-01-01");
    await userEvent.type(toInput as HTMLInputElement, "2026-01-31");
    expect(fromInput).toHaveValue("2026-01-01");
    expect(toInput).toHaveValue("2026-01-31");
  });

  it("clears the 'from' date back to null", async () => {
    renderDropdown({ value: { ...emptyTicketFilter, dateFrom: "2026-01-01" } });
    await openFilter();
    const [fromInput] = document.querySelectorAll('input[type="date"]');
    await userEvent.clear(fromInput as HTMLInputElement);
    expect(fromInput).toHaveValue("");
  });

  it("clears the 'to' date back to null", async () => {
    renderDropdown({ value: { ...emptyTicketFilter, dateTo: "2026-01-31" } });
    await openFilter();
    const [, toInput] = document.querySelectorAll('input[type="date"]');
    await userEvent.clear(toInput as HTMLInputElement);
    expect(toInput).toHaveValue("");
  });

  it("prefills the date range inputs from an existing filter value", async () => {
    renderDropdown({
      value: { ...emptyTicketFilter, dateFrom: "2026-01-01", dateTo: "2026-01-31" },
    });
    await openFilter();
    const [fromInput, toInput] = document.querySelectorAll('input[type="date"]');
    expect(fromInput).toHaveValue("2026-01-01");
    expect(toInput).toHaveValue("2026-01-31");
  });
});

describe("actions", () => {
  it("applies the draft and closes the dropdown", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("To Do"));
    const applyButtons = screen.getAllByRole("button", { name: "Filter" });
    await userEvent.click(applyButtons[applyButtons.length - 1]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tagIds: [1] }),
    );
    expect(screen.queryByText("Filters")).toBeNull();
  });

  it("closes without applying via the X button", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("To Do"));
    await userEvent.click(screen.getByRole("button", { name: "Close filters" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("Filters")).toBeNull();
  });

  it("clears the draft fields without closing or applying", async () => {
    const { onChange } = renderDropdown();
    await openFilter();
    await userEvent.click(screen.getByLabelText("To Do"));
    await userEvent.click(screen.getByRole("button", { name: "clear filter" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByLabelText("To Do")).not.toBeChecked();
  });

  it("resyncs the draft when the value prop changes externally", async () => {
    const { rerender } = render(
      <TicketFilterDropdown
        value={emptyTicketFilter}
        onChange={jest.fn()}
        members={[JANE, MARCO]}
        tags={[TODO, DONE]}
      />,
    );
    await openFilter();
    await userEvent.click(screen.getByLabelText("To Do"));
    expect(screen.getByLabelText("To Do")).toBeChecked();

    rerender(
      <TicketFilterDropdown
        value={{ ...emptyTicketFilter, tagIds: [2] }}
        onChange={jest.fn()}
        members={[JANE, MARCO]}
        tags={[TODO, DONE]}
      />,
    );
    expect(screen.getByLabelText("To Do")).not.toBeChecked();
    expect(screen.getByLabelText("Done")).toBeChecked();
  });
});
