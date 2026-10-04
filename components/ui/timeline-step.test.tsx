import { render, screen } from "@testing-library/react";
import { Check } from "lucide-react";
import { TimelineStep } from "./timeline-step";

it("renders the label and, when given, a date", () => {
  render(<TimelineStep icon={Check} label="Created" date="Jan 1, 2026" tone="done" />);
  expect(screen.getByText("Created")).toBeInTheDocument();
  expect(screen.getByText("Jan 1, 2026")).toBeInTheDocument();
});

it("omits the date when not given", () => {
  render(<TimelineStep icon={Check} label="Created" tone="done" />);
  expect(screen.getByText("Created")).toBeInTheDocument();
});

it("renders the connecting line unless it's the last step", () => {
  const { container, rerender } = render(
    <TimelineStep icon={Check} label="Created" tone="done" />,
  );
  expect(container.querySelector(".absolute.top-6")).not.toBeNull();

  rerender(<TimelineStep icon={Check} label="Created" tone="done" isLast />);
  expect(container.querySelector(".absolute.top-6")).toBeNull();
});

it("applies muted text for the 'upcoming' tone", () => {
  render(<TimelineStep icon={Check} label="Not yet" tone="upcoming" />);
  expect(screen.getByText("Not yet").className).toContain("text-ink-faint");
});

it("uses an accentColor override instead of the tone's fixed style when given", () => {
  const { container } = render(
    <TimelineStep icon={Check} label="Tagged" tone="done" accentColor="#3B82C4" />,
  );
  const bubble = container.querySelector("span.z-10") as HTMLElement;
  expect(bubble.style.color).toBe("rgb(59, 130, 196)");
  expect(bubble.className).not.toContain("bg-accent-subtle");
});
