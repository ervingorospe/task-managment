import { render } from "@testing-library/react";
import { DetailHeaderSkeleton } from "./detail-header-skeleton";

it("renders without crashing", () => {
  const { container } = render(<DetailHeaderSkeleton />);
  expect(container.firstChild).not.toBeNull();
});
