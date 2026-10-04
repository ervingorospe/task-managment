import { render, screen } from "@testing-library/react";
import { Ticket } from "lucide-react";
import { StatTileCard } from "./stat-tile-card";

it("renders label, value, and caption with the given colors", () => {
  const { container } = render(
    <StatTileCard
      label="Total tickets"
      value={42}
      caption="Across all statuses"
      icon={Ticket}
      tint="bg-accent-subtle"
      iconColor="text-accent-text"
      valueColor="text-ink"
      barColor="bg-accent"
    />,
  );
  expect(screen.getByText("Total tickets")).toBeInTheDocument();
  expect(screen.getByText("42")).toBeInTheDocument();
  expect(screen.getByText("Across all statuses")).toBeInTheDocument();
  expect(container.querySelector(".bg-accent")).not.toBeNull();
});
