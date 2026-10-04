import { render, screen } from "@testing-library/react";
import { CapacityHeader } from "./capacity-header";

it("renders title, subtitle, and the used/capacity line", () => {
  render(
    <CapacityHeader
      title="Members"
      subtitle="Manage your team"
      used={4}
      capacity={20}
      unitLabel="members"
    />,
  );
  expect(screen.getByText("Members")).toBeInTheDocument();
  expect(screen.getByText("Manage your team")).toBeInTheDocument();
  expect(screen.getByText("4 / 20 members used")).toBeInTheDocument();
});

it("renders trailing content when given", () => {
  render(
    <CapacityHeader
      title="Members"
      subtitle="Manage your team"
      used={4}
      capacity={20}
      unitLabel="members"
      trailing={<button>Invite</button>}
    />,
  );
  expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
});
