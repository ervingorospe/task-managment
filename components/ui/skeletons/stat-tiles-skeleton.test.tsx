import { render } from "@testing-library/react";
import { StatTilesSkeleton } from "./stat-tiles-skeleton";

it("defaults to 4 large tiles with a trailing bar", () => {
  const { container } = render(<StatTilesSkeleton />);
  const tiles = container.firstChild?.childNodes;
  expect(tiles).toHaveLength(4);
  // "large" variant adds a trailing mt-3 bar per tile.
  expect((tiles![0] as HTMLElement).querySelector(".mt-3")).not.toBeNull();
});

it("renders the 'mini' variant without the trailing bar", () => {
  const { container } = render(<StatTilesSkeleton variant="mini" count={2} />);
  const tiles = container.firstChild?.childNodes;
  expect(tiles).toHaveLength(2);
  expect((tiles![0] as HTMLElement).querySelector(".mt-3")).toBeNull();
});

it("renders a custom count and className", () => {
  const { container } = render(<StatTilesSkeleton count={7} className="my-extra" />);
  expect(container.firstChild?.childNodes).toHaveLength(7);
  expect((container.firstChild as HTMLElement).className).toContain("my-extra");
});
