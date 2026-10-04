import { render, screen } from "@testing-library/react";
import { RequestStatusBadge } from "./request-status-badge";
import type { TicketRequestStatus } from "@/lib/types/ticket/ticket-request.type";

it.each<[TicketRequestStatus, string]>([
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["cancelled", "Cancelled"],
])("renders the %s status as '%s'", (status, label) => {
  render(<RequestStatusBadge status={status} />);
  expect(screen.getByText(label)).toBeInTheDocument();
});
