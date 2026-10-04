import { render } from "@testing-library/react";
import { PageHeaderSkeleton } from "./page-header-skeleton";

it("does not render an action placeholder by default", () => {
  const { container } = render(<PageHeaderSkeleton />);
  expect(container.querySelectorAll(".h-9")).toHaveLength(0);
});

it("renders an action placeholder when withAction is true", () => {
  const { container } = render(<PageHeaderSkeleton withAction />);
  expect(container.querySelectorAll(".h-9")).toHaveLength(1);
});
