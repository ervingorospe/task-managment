import { render } from "@testing-library/react";
import { OrganizationInfoSkeleton } from "./organization-info-skeleton";

it("renders without crashing", () => {
  const { container } = render(<OrganizationInfoSkeleton />);
  expect(container.firstChild).not.toBeNull();
});
