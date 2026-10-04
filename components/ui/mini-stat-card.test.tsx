import { render, screen } from "@testing-library/react";
import { Ticket } from "lucide-react";
import { MiniStatCard } from "./mini-stat-card";

it("renders the label and value with fixed tint/icon/bar colors", () => {
  const { container } = render(
    <MiniStatCard
      label="Total"
      value={12}
      icon={Ticket}
      tint="bg-accent-subtle"
      iconColor="text-accent-text"
      barColor="bg-accent"
    />,
  );
  expect(screen.getByText("Total")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(container.querySelector(".bg-accent-subtle")).not.toBeNull();
});

it("uses text-ink as the default value color", () => {
  render(<MiniStatCard label="Total" value={12} icon={Ticket} />);
  expect(screen.getByText("12").className).toContain("text-ink");
});

it("accepts a custom valueColor", () => {
  render(<MiniStatCard label="Total" value={12} icon={Ticket} valueColor="text-danger" />);
  expect(screen.getByText("12").className).toContain("text-danger");
});

it("overrides tint/iconColor/barColor with accentColor when given", () => {
  const { container } = render(
    <MiniStatCard
      label="Total"
      value={12}
      icon={Ticket}
      tint="bg-accent-subtle"
      iconColor="text-accent-text"
      barColor="bg-accent"
      accentColor="#3B82C4"
    />,
  );
  expect(container.querySelector(".bg-accent-subtle")).toBeNull();
  const bubble = container.querySelector("span.rounded-full") as HTMLElement;
  expect(bubble.style.color).toBe("rgb(59, 130, 196)");
});
