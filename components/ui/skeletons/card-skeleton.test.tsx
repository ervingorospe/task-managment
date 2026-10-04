import { render } from "@testing-library/react";
import { CardSkeleton } from "./card-skeleton";

it("renders a subtitle placeholder by default", () => {
  const { container } = render(
    <CardSkeleton>
      <div>content</div>
    </CardSkeleton>,
  );
  // Title + subtitle = 2 top-level skeleton bars in the header block.
  expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2);
});

it("omits the subtitle placeholder when withSubtitle is false", () => {
  const { container } = render(
    <CardSkeleton withSubtitle={false}>
      <div>content</div>
    </CardSkeleton>,
  );
  expect(container.querySelectorAll(".animate-pulse")).toHaveLength(1);
});

it("renders its children", () => {
  const { getByText } = render(
    <CardSkeleton>
      <div>my content</div>
    </CardSkeleton>,
  );
  expect(getByText("my content")).toBeInTheDocument();
});
