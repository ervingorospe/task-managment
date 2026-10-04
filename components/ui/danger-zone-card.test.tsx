import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DangerZoneCard, DangerZoneRow } from "./danger-zone-card";

describe("DangerZoneCard", () => {
  it("uses default title/subtitle", () => {
    render(<DangerZoneCard>content</DangerZoneCard>);
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });

  it("accepts a custom title/subtitle", () => {
    render(
      <DangerZoneCard title="Custom" subtitle="Custom subtitle">
        content
      </DangerZoneCard>,
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Custom subtitle")).toBeInTheDocument();
  });
});

describe("DangerZoneRow", () => {
  it("renders a danger-styled row by default and calls onAction", async () => {
    const onAction = jest.fn();
    render(
      <DangerZoneRow
        title="Delete organization"
        description="This can't be undone."
        actionLabel="Delete"
        onAction={onAction}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders a neutral row for the 'default' variant", () => {
    render(
      <DangerZoneRow
        title="Leave organization"
        description="You can rejoin if invited again."
        actionLabel="Leave"
        onAction={jest.fn()}
        variant="default"
      />,
    );
    expect(screen.getByRole("button", { name: "Leave" })).toBeInTheDocument();
  });
});
