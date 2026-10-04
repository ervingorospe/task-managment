import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Button } from "./button";

it("renders as a primary button by default", () => {
  render(<Button>Save</Button>);
  expect(screen.getByRole("button", { name: "Save" }).className).toContain("bg-accent");
});

it.each(["secondary", "ghost", "danger"] as const)("renders the %s variant", (variant) => {
  render(<Button variant={variant}>Action</Button>);
  expect(screen.getByRole("button")).toBeInTheDocument();
});

it("merges a custom className", () => {
  render(<Button className="my-extra">Save</Button>);
  expect(screen.getByRole("button").className).toContain("my-extra");
});

it("forwards a ref to the underlying button element", () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref}>Save</Button>);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
});

it("forwards native button props (onClick, disabled)", async () => {
  const onClick = jest.fn();
  render(
    <Button onClick={onClick} disabled>
      Save
    </Button>,
  );
  expect(screen.getByRole("button")).toBeDisabled();
});
