import { render } from "@testing-library/react";
import { ReportsSkeleton } from "./reports-skeleton";

it("renders without crashing", () => {
  const { container } = render(<ReportsSkeleton />);
  expect(container.firstChild).not.toBeNull();
});
