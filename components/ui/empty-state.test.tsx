import { render, screen } from "@testing-library/react";
import EmptyState from "./empty-state";

it("renders the subtitle without a title by default", () => {
  render(<EmptyState subtitle="Nothing here yet." />);
  expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  expect(screen.queryByText(/./, { selector: "p.font-medium" })).toBeNull();
});

it("renders a title when given", () => {
  render(<EmptyState title="No tickets" subtitle="Create your first ticket." />);
  expect(screen.getByText("No tickets")).toBeInTheDocument();
});

it("renders children (e.g. an action button)", () => {
  render(
    <EmptyState subtitle="Nothing here yet.">
      <button>Create ticket</button>
    </EmptyState>,
  );
  expect(screen.getByRole("button", { name: "Create ticket" })).toBeInTheDocument();
});
