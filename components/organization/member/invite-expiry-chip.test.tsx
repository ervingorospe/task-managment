import { render, screen } from "@testing-library/react";
import { InviteExpiryChip } from "./invite-expiry-chip";

it("shows 'Expired' for the expired state", () => {
  render(<InviteExpiryChip state="expired" />);
  expect(screen.getByText("Expired")).toBeInTheDocument();
});

it("shows 'Expiring soon' for the expiring-soon state", () => {
  render(<InviteExpiryChip state="expiring-soon" />);
  expect(screen.getByText("Expiring soon")).toBeInTheDocument();
});
