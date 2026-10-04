import { render, screen } from "@testing-library/react";
import { MetaBadge } from "./meta-badge";

it("renders its children", () => {
  render(<MetaBadge>Default</MetaBadge>);
  expect(screen.getByText("Default")).toBeInTheDocument();
});
