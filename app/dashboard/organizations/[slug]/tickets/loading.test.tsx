import { render } from "@testing-library/react";
import Loading from "./loading";

it("renders the page header, stat tiles, and table skeletons without crashing", () => {
  const { container } = render(<Loading />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});
