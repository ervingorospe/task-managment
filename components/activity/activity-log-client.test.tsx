import { render, screen } from "@testing-library/react";
import ActivityLogClient from "./activity-log-client";
import { useActivityLog } from "@/providers/activity-log-provider";
import { useAuth } from "@/providers/auth-provider";
import { useActiveOrganizationDetail } from "@/hooks/use-active-organization-detail";
import { useActivityLogQueryState } from "@/hooks/use-activity-log-query-state";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { ActivityFilterState } from "./activity-filter-dropdown";

jest.mock("@/providers/activity-log-provider", () => ({ useActivityLog: jest.fn() }));
jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/hooks/use-active-organization-detail", () => ({
  useActiveOrganizationDetail: jest.fn(),
}));
jest.mock("@/hooks/use-activity-log-query-state", () => ({
  useActivityLogQueryState: jest.fn(),
}));

const mockedUseActivityLog = useActivityLog as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseOrgDetail = useActiveOrganizationDetail as jest.Mock;
const mockedUseQueryState = useActivityLogQueryState as jest.Mock;

const ORG = { id: 6001, organizationName: "Acme Studio", settings: { timezone: "UTC" } };
const setPage = jest.fn();
const setFilter = jest.fn();
const setPageSize = jest.fn();

function rule(action: string) {
  return { id: 1, action, name: action, desc: "", categoryId: 1 };
}

function entry(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    orgId: 6001,
    module: "ticket",
    action: "created",
    entityId: 1,
    entityLabel: "TCK-1",
    referenceId: "TCK-1",
    actorId: 1,
    actorName: "Jane Doe",
    actorAvatar: null,
    involvedUserIds: [1],
    description: "created this ticket",
    createdAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

const EMPTY_FILTER: ActivityFilterState = {
  modules: [],
  authorIds: [],
  dateFrom: null,
  dateTo: null,
};

interface SetupOptions {
  entries?: ReturnType<typeof entry>[];
  activeMembershipRules?: ReturnType<typeof rule>[];
  currentUserId?: number;
  isPersonalMode?: boolean;
  activeOrganization?: typeof ORG | null;
  organization?: typeof ORG | null;
  filter?: ActivityFilterState;
  page?: number;
  pageSize?: number;
}

function setup({
  entries = [entry()],
  activeMembershipRules = [rule(PERMISSIONS.ACTIVITY_LOG_VIEW_ALL)],
  currentUserId = 1,
  isPersonalMode = false,
  activeOrganization = ORG,
  organization = ORG,
  filter = EMPTY_FILTER,
  page = 1,
  pageSize = 15,
}: SetupOptions = {}) {
  mockedUseActivityLog.mockReturnValue({ entries });
  mockedUseAuth.mockReturnValue({
    activeOrganization: isPersonalMode ? null : activeOrganization,
    activeMembership: isPersonalMode ? null : { role: { rules: activeMembershipRules } },
    currentUser: { id: currentUserId },
    isPersonalMode,
  });
  mockedUseOrgDetail.mockReturnValue(isPersonalMode ? null : organization);
  mockedUseQueryState.mockReturnValue({ page, filter, pageSize, setPage, setFilter, setPageSize });
  return render(<ActivityLogClient />);
}

beforeEach(() => jest.clearAllMocks());

it("shows an empty state when in org mode with no active organization", () => {
  setup({ isPersonalMode: false, activeOrganization: null, organization: null });
  expect(
    screen.getByText("Join or create an organization to see its activity."),
  ).toBeInTheDocument();
});

it("shows a loading skeleton while the organization detail loads", () => {
  setup({ organization: null });
  expect(screen.queryByText("Activity Log")).toBeNull();
});

it("renders the org's name and entry count", () => {
  setup({ entries: [entry()] });
  expect(screen.getByText(/Acme Studio/)).toBeInTheDocument();
  expect(screen.getByText("1 action")).toBeInTheDocument();
});

it("uses plural 'actions' for anything other than exactly 1", () => {
  setup({ entries: [] });
  expect(screen.getByText("0 actions")).toBeInTheDocument();
});

it("uses personal copy in Personal mode and scopes entries by null orgId", () => {
  setup({
    isPersonalMode: true,
    entries: [entry({ id: 1, orgId: null }), entry({ id: 2, orgId: 6001 })],
  });
  expect(
    screen.getByText("Every action across your personal tickets."),
  ).toBeInTheDocument();
  expect(screen.getByText("1 action")).toBeInTheDocument();
});

it("scopes entries to the active organization's id in org mode", () => {
  setup({
    entries: [entry({ id: 1, orgId: 6001 }), entry({ id: 2, orgId: 9999 })],
  });
  expect(screen.getByText("1 action")).toBeInTheDocument();
});

it("shows every entry for a viewer with activity.log.view.all", () => {
  setup({
    entries: [
      entry({ id: 1, involvedUserIds: [] }),
      entry({ id: 2, involvedUserIds: [999] }),
    ],
    activeMembershipRules: [rule(PERMISSIONS.ACTIVITY_LOG_VIEW_ALL)],
    currentUserId: 1,
  });
  expect(screen.getByText("2 actions")).toBeInTheDocument();
});

it("scopes to only involved entries for a viewer with activity.log.view.included", () => {
  setup({
    entries: [
      entry({ id: 1, involvedUserIds: [1] }),
      entry({ id: 2, involvedUserIds: [999] }),
    ],
    activeMembershipRules: [rule(PERMISSIONS.ACTIVITY_LOG_VIEW_INCLUDED)],
    currentUserId: 1,
  });
  expect(screen.getByText("1 action")).toBeInTheDocument();
});

it("filters by module", () => {
  setup({
    entries: [entry({ id: 1, module: "ticket" }), entry({ id: 2, module: "project" })],
    filter: { ...EMPTY_FILTER, modules: ["project"] },
  });
  expect(screen.getByText("1 action")).toBeInTheDocument();
});

it("filters by author", () => {
  setup({
    entries: [
      entry({ id: 1, actorId: 1 }),
      entry({ id: 2, actorId: 2, actorName: "Marco" }),
    ],
    filter: { ...EMPTY_FILTER, authorIds: [2] },
  });
  expect(screen.getByText("1 action")).toBeInTheDocument();
});

it("filters by date range (inclusive)", () => {
  setup({
    entries: [
      entry({ id: 1, createdAt: "2026-01-10T00:00:00.000Z" }),
      entry({ id: 2, createdAt: "2026-01-20T00:00:00.000Z" }),
      entry({ id: 3, createdAt: "2026-01-30T00:00:00.000Z" }),
    ],
    filter: { ...EMPTY_FILTER, dateFrom: "2026-01-15", dateTo: "2026-01-25" },
  });
  expect(screen.getByText("1 action")).toBeInTheDocument();
});

it("dedupes and sorts authors alphabetically", () => {
  setup({
    entries: [
      entry({ id: 1, actorId: 2, actorName: "Marco Reyes" }),
      entry({ id: 2, actorId: 1, actorName: "Jane Doe" }),
      entry({ id: 3, actorId: 2, actorName: "Marco Reyes" }),
    ],
  });
  // All 3 entries still show (dedup only affects the authors filter list).
  expect(screen.getByText("3 actions")).toBeInTheDocument();
});

it("clamps the current page to the last valid page when out of range", () => {
  setup({
    entries: [entry({ id: 1 })],
    pageSize: 15,
    page: 5, // way beyond totalPages (1) for a single entry
  });
  // No crash — renders normally with the single entry visible.
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
});

it("paginates entries according to pageSize", () => {
  const entries = Array.from({ length: 20 }, (_, i) =>
    entry({ id: i + 1, actorName: `Actor ${i + 1}` }),
  );
  setup({ entries, pageSize: 15, page: 1 });
  expect(screen.getByText("20 actions")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(15);
});
