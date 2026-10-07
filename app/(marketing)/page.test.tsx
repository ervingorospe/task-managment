import { render, screen } from "@testing-library/react";
import HomePage from "./page";

it("renders the hero heading and primary CTAs", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", {
      name: "Ticketing, projects, and reporting — without the chaos.",
    }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /Get started/ })[0]).toHaveAttribute(
    "href",
    "/signup",
  );
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
});

it("renders every feature card", () => {
  render(<HomePage />);
  expect(screen.getByText("Multi-tenant organizations")).toBeInTheDocument();
  expect(screen.getByText("Granular access control")).toBeInTheDocument();
  expect(screen.getByText("Tickets, projects & requests")).toBeInTheDocument();
  expect(screen.getByText("Invite-only membership")).toBeInTheDocument();
  expect(screen.getByText("Real authentication")).toBeInTheDocument();
  expect(screen.getByText("Live updates")).toBeInTheDocument();
});

it("renders the how-it-works steps", () => {
  render(<HomePage />);
  expect(screen.getByText("Choose your space")).toBeInTheDocument();
  expect(screen.getByText("Triage the work")).toBeInTheDocument();
  expect(screen.getByText("Stay on top of it")).toBeInTheDocument();
});

it("renders the bottom CTA section", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", { name: "Ready to get organized?" }),
  ).toBeInTheDocument();
});
