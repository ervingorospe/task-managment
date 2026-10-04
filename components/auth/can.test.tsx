import { render, screen } from "@testing-library/react";
import { Can } from "./can";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

function rule(action: string) {
  return { id: 1, action, name: action, desc: "", categoryId: 1 };
}

function membership(rules: ReturnType<typeof rule>[]) {
  return { role: { rules } };
}

it("always allows in Personal mode, regardless of any permission checks", () => {
  mockedUseAuth.mockReturnValue({ activeMembership: null, isPersonalMode: true });
  render(
    <Can action={PERMISSIONS.ROLE_ADD}>
      <span>Add role</span>
    </Can>,
  );
  expect(screen.getByText("Add role")).toBeInTheDocument();
});

describe("action", () => {
  it("renders children when the single action permission is present", () => {
    mockedUseAuth.mockReturnValue({
      activeMembership: membership([rule(PERMISSIONS.ROLE_ADD)]),
      isPersonalMode: false,
    });
    render(
      <Can action={PERMISSIONS.ROLE_ADD}>
        <span>Add role</span>
      </Can>,
    );
    expect(screen.getByText("Add role")).toBeInTheDocument();
  });

  it("renders the fallback when the action permission is missing", () => {
    mockedUseAuth.mockReturnValue({
      activeMembership: membership([]),
      isPersonalMode: false,
    });
    render(
      <Can action={PERMISSIONS.ROLE_ADD} fallback={<span>No access</span>}>
        <span>Add role</span>
      </Can>,
    );
    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.queryByText("Add role")).toBeNull();
  });

  it("renders nothing (not even a fallback) by default when denied", () => {
    mockedUseAuth.mockReturnValue({
      activeMembership: membership([]),
      isPersonalMode: false,
    });
    const { container } = render(
      <Can action={PERMISSIONS.ROLE_ADD}>
        <span>Add role</span>
      </Can>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("anyOf", () => {
  it("renders children when at least one permission is present", () => {
    mockedUseAuth.mockReturnValue({
      activeMembership: membership([rule(PERMISSIONS.MEMBER_VIEW_OWNER)]),
      isPersonalMode: false,
    });
    render(
      <Can anyOf={[PERMISSIONS.MEMBER_VIEW_OWNER, PERMISSIONS.MEMBER_VIEW_MEMBERS]}>
        <span>Members table</span>
      </Can>,
    );
    expect(screen.getByText("Members table")).toBeInTheDocument();
  });

  it("denies when none of the permissions are present", () => {
    mockedUseAuth.mockReturnValue({
      activeMembership: membership([]),
      isPersonalMode: false,
    });
    render(
      <Can anyOf={[PERMISSIONS.MEMBER_VIEW_OWNER, PERMISSIONS.MEMBER_VIEW_MEMBERS]}>
        <span>Members table</span>
      </Can>,
    );
    expect(screen.queryByText("Members table")).toBeNull();
  });
});

describe("allOf", () => {
  it("renders children only when every permission is present", () => {
    mockedUseAuth.mockReturnValue({
      activeMembership: membership([
        rule(PERMISSIONS.TICKET_VIEW_ALL),
        rule(PERMISSIONS.TICKET_ASSIGN),
      ]),
      isPersonalMode: false,
    });
    render(
      <Can allOf={[PERMISSIONS.TICKET_VIEW_ALL, PERMISSIONS.TICKET_ASSIGN]}>
        <span>Assign</span>
      </Can>,
    );
    expect(screen.getByText("Assign")).toBeInTheDocument();
  });

  it("denies when only some of the permissions are present", () => {
    mockedUseAuth.mockReturnValue({
      activeMembership: membership([rule(PERMISSIONS.TICKET_VIEW_ALL)]),
      isPersonalMode: false,
    });
    render(
      <Can allOf={[PERMISSIONS.TICKET_VIEW_ALL, PERMISSIONS.TICKET_ASSIGN]}>
        <span>Assign</span>
      </Can>,
    );
    expect(screen.queryByText("Assign")).toBeNull();
  });
});

it("combines allOf and anyOf as an AND between the two groups", () => {
  mockedUseAuth.mockReturnValue({
    activeMembership: membership([
      rule(PERMISSIONS.TICKET_VIEW_ALL),
      rule(PERMISSIONS.MEMBER_VIEW_OWNER),
    ]),
    isPersonalMode: false,
  });
  render(
    <Can allOf={[PERMISSIONS.TICKET_VIEW_ALL]} anyOf={[PERMISSIONS.MEMBER_VIEW_OWNER]}>
      <span>Combined</span>
    </Can>,
  );
  expect(screen.getByText("Combined")).toBeInTheDocument();
});

it("denies when allOf passes but anyOf fails", () => {
  mockedUseAuth.mockReturnValue({
    activeMembership: membership([rule(PERMISSIONS.TICKET_VIEW_ALL)]),
    isPersonalMode: false,
  });
  render(
    <Can allOf={[PERMISSIONS.TICKET_VIEW_ALL]} anyOf={[PERMISSIONS.MEMBER_VIEW_OWNER]}>
      <span>Combined</span>
    </Can>,
  );
  expect(screen.queryByText("Combined")).toBeNull();
});

it("treats no active membership as having no rules (not a crash)", () => {
  mockedUseAuth.mockReturnValue({ activeMembership: null, isPersonalMode: false });
  render(
    <Can action={PERMISSIONS.ROLE_ADD}>
      <span>Add role</span>
    </Can>,
  );
  expect(screen.queryByText("Add role")).toBeNull();
});
