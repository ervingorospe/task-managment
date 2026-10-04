import { render, screen } from "@testing-library/react";
import Container from "./container";

it("renders its children", () => {
  render(
    <Container>
      <span>content</span>
    </Container>,
  );
  expect(screen.getByText("content")).toBeInTheDocument();
});
