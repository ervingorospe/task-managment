import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

it("renders the heading and intro", () => {
  render(<AboutPage />);
  expect(screen.getByRole("heading", { name: "About Relay" })).toBeInTheDocument();
});

it("renders the 'why Relay exists' section", () => {
  render(<AboutPage />);
  expect(screen.getByText("Why Relay exists")).toBeInTheDocument();
});

it("renders every principle", () => {
  render(<AboutPage />);
  expect(screen.getByText("Isolation is non-negotiable")).toBeInTheDocument();
  expect(screen.getByText("Permissions should be composable")).toBeInTheDocument();
  expect(screen.getByText("Clarity over clutter")).toBeInTheDocument();
  expect(screen.getByText("Built for real workflows")).toBeInTheDocument();
});
