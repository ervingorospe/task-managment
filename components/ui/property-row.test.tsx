import { render, screen } from "@testing-library/react";
import PropertyRow from "./property-row";

it("renders the caption variant by default, with children below the label", () => {
  const { container } = render(
    <PropertyRow label="Status">
      <span>Active</span>
    </PropertyRow>,
  );
  expect(screen.getByText("Status")).toBeInTheDocument();
  expect(screen.getByText("Active")).toBeInTheDocument();
  // caption variant renders children directly, no wrapper div.
  expect(container.querySelector(".mt-1")).toBeNull();
});

it("renders the plain variant with an icon+value wrapper", () => {
  const { container } = render(
    <PropertyRow label="Email" variant="plain">
      <span>jane@acmestudio.com</span>
    </PropertyRow>,
  );
  expect(container.querySelector(".mt-1.flex")).not.toBeNull();
});

it("applies a custom className to the outer wrapper", () => {
  const { container } = render(
    <PropertyRow label="Status" className="my-extra">
      <span>Active</span>
    </PropertyRow>,
  );
  expect((container.firstChild as HTMLElement).className).toBe("my-extra");
});
