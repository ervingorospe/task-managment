import { render } from "@testing-library/react";
import { Skeleton, SkeletonText, SkeletonCircle } from "./skeleton";

it("Skeleton renders with a custom className and style", () => {
  const { container } = render(<Skeleton className="h-4 w-4" style={{ opacity: 0.5 }} />);
  const el = container.firstChild as HTMLElement;
  expect(el.className).toContain("animate-pulse");
  expect(el.className).toContain("h-4 w-4");
  expect(el.style.opacity).toBe("0.5");
});

it("SkeletonText defaults to full width", () => {
  const { container } = render(<SkeletonText />);
  expect((container.firstChild as HTMLElement).className).toContain("w-full");
});

it("SkeletonText accepts a custom width", () => {
  const { container } = render(<SkeletonText width="w-32" />);
  expect((container.firstChild as HTMLElement).className).toContain("w-32");
});

it("SkeletonCircle defaults to h-8 w-8", () => {
  const { container } = render(<SkeletonCircle />);
  expect((container.firstChild as HTMLElement).className).toContain("h-8 w-8");
});

it("SkeletonCircle accepts a custom size", () => {
  const { container } = render(<SkeletonCircle size="h-12 w-12" />);
  expect((container.firstChild as HTMLElement).className).toContain("h-12 w-12");
});
