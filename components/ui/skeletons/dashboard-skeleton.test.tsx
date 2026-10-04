import { render } from "@testing-library/react";
import { DashboardSkeleton } from "./dashboard-skeleton";

it("renders without crashing", () => {
  const { container } = render(<DashboardSkeleton />);
  expect(container.firstChild).not.toBeNull();
});
