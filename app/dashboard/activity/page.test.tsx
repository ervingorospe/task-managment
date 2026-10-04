import { render, screen } from "@testing-library/react";
import ActivityPage from "./page";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/components/activity/activity-log-client", () => function MockActivityLogClient() {
  return <div>ActivityLogClient</div>;
});

const mockedUseAuth = useAuth as jest.Mock;

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: { rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })) },
    },
    isPersonalMode: false,
  });
}

it("shows a permission fallback without activity_log.view_all or activity_log.view_included", () => {
  withPermissions([]);
  render(<ActivityPage />);
  expect(
    screen.getByText("You do not have permission to view the activity log."),
  ).toBeInTheDocument();
  expect(screen.queryByText("ActivityLogClient")).toBeNull();
});

it("renders the activity log client with activity_log.view_included", () => {
  withPermissions([PERMISSIONS.ACTIVITY_LOG_VIEW_INCLUDED]);
  render(<ActivityPage />);
  expect(screen.getByText("ActivityLogClient")).toBeInTheDocument();
});

it("renders the activity log client with activity_log.view_all", () => {
  withPermissions([PERMISSIONS.ACTIVITY_LOG_VIEW_ALL]);
  render(<ActivityPage />);
  expect(screen.getByText("ActivityLogClient")).toBeInTheDocument();
});
