import { render, screen } from "@testing-library/react";
import { DueChip } from "./due-chip";

it("shows 'Overdue' with danger styling", () => {
  render(<DueChip state="overdue" />);
  expect(screen.getByText("Overdue").className).toContain("text-danger");
});

it("shows 'Due today' with warning styling", () => {
  render(<DueChip state="due-today" />);
  expect(screen.getByText("Due today").className).toContain("text-warning");
});
