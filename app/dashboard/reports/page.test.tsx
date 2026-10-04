import { render, screen } from "@testing-library/react";
import ReportsPage from "./page";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});
jest.mock("@/components/reports/reports-client", () => function MockReportsClient() {
  return <div>ReportsClient</div>;
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

it("shows a permission fallback without report.view_all or report.view_own", () => {
  withPermissions([]);
  render(<ReportsPage />);
  expect(screen.getByText("You do not have permission to view reports.")).toBeInTheDocument();
  expect(screen.queryByText("ReportsClient")).toBeNull();
});

it("renders the reports client with report.view_own", () => {
  withPermissions([PERMISSIONS.REPORT_VIEW_OWN]);
  render(<ReportsPage />);
  expect(screen.getByText("ReportsClient")).toBeInTheDocument();
});

it("renders the reports client with report.view_all", () => {
  withPermissions([PERMISSIONS.REPORT_VIEW_ALL]);
  render(<ReportsPage />);
  expect(screen.getByText("ReportsClient")).toBeInTheDocument();
});
