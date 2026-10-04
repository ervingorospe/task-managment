import { render, screen } from "@testing-library/react";
import List from "./list";

it("renders children and a custom className", () => {
  const { container } = render(<List className="my-extra">content</List>);
  expect(screen.getByText("content")).toBeInTheDocument();
  expect((container.firstChild as HTMLElement).className).toContain("my-extra");
});

it("ListItem renders title only by default", () => {
  render(<List.ListItem title="Jane Doe" />);
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
});

it("ListItem renders leading, subtitle, and trailing when given", () => {
  render(
    <List.ListItem
      leading={<span>Avatar</span>}
      title="Jane Doe"
      subtitle="jane@acmestudio.com"
      trailing={<button>Remove</button>}
    />,
  );
  expect(screen.getByText("Avatar")).toBeInTheDocument();
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
});

it("ListItem applies a custom className", () => {
  const { container } = render(<List.ListItem title="Jane Doe" className="my-row" />);
  expect((container.firstChild as HTMLElement).className).toContain("my-row");
});
