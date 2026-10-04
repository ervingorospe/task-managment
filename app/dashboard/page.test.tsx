import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

jest.mock("@/components/dashboard/dashboard-client", () => function MockDashboardClient() {
  return <div>Dashboard Client</div>;
});

it("renders the dashboard client", () => {
  render(<DashboardPage />);
  expect(screen.getByText("Dashboard Client")).toBeInTheDocument();
});
