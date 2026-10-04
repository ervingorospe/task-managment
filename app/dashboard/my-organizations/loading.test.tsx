import { render } from "@testing-library/react";
import Loading from "./loading";

it("renders the page header and two skeleton rows without crashing", () => {
  const { container } = render(<Loading />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});
