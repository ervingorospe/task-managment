import { render, screen } from "@testing-library/react";
import Card from "./card";

it("renders only children when no optional props are given", () => {
  render(<Card>content</Card>);
  expect(screen.getByText("content")).toBeInTheDocument();
  expect(screen.queryByRole("heading")).toBeNull();
});

it("renders title, subtitle, and desc when given", () => {
  render(
    <Card title="Roles" subtitle="Manage access" desc="Extra detail">
      content
    </Card>,
  );
  expect(screen.getByRole("heading", { name: "Roles" })).toBeInTheDocument();
  expect(screen.getByText("Manage access")).toBeInTheDocument();
  expect(screen.getByText("Extra detail")).toBeInTheDocument();
});

it("renders a banner between the header and children", () => {
  render(<Card banner={<div>Saved!</div>}>content</Card>);
  expect(screen.getByText("Saved!")).toBeInTheDocument();
});

it("renders headerActions next to the title", () => {
  render(<Card headerActions={<button>Edit</button>}>content</Card>);
  expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
});

it("renders footerActions in a bordered footer", () => {
  render(<Card footerActions={<button>Save</button>}>content</Card>);
  expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
});
