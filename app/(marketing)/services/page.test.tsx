import { render, screen } from "@testing-library/react";
import ServicesPage from "./page";

it("renders the heading", () => {
  render(<ServicesPage />);
  expect(
    screen.getByRole("heading", { name: "What Relay gives every team" }),
  ).toBeInTheDocument();
});

it("renders every service card", () => {
  render(<ServicesPage />);
  expect(screen.getByText("Ticketing & work orders")).toBeInTheDocument();
  expect(screen.getByText("Projects")).toBeInTheDocument();
  expect(screen.getByText("Client request portal")).toBeInTheDocument();
  expect(screen.getByText("Roles & permissions")).toBeInTheDocument();
  expect(screen.getByText("Reporting & analytics")).toBeInTheDocument();
  expect(screen.getByText("Real-time collaboration")).toBeInTheDocument();
  expect(screen.getByText("Multi-tenant organizations")).toBeInTheDocument();
});
