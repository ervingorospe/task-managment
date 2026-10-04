import { render, screen } from "@testing-library/react";
import TicketOverviewCard from "./ticket-overview-card";

// These sub-sections are tested in their own files — mocked here so this
// file focuses on TicketOverviewCard's own composition/orchestration
// (subtitle text, hideComments, and that props actually get passed down).
jest.mock("./ticket-description-section", () => ({
  __esModule: true,
  default: (props: { description?: string }) => (
    <div data-testid="description-section">{props.description}</div>
  ),
}));
jest.mock("./ticket-attachments-section", () => ({
  __esModule: true,
  default: (props: { ticketTitle: string }) => (
    <div data-testid="attachments-section">{props.ticketTitle}</div>
  ),
}));
jest.mock("./ticket-comments-section", () => ({
  __esModule: true,
  default: (props: { ticketTitle: string }) => (
    <div data-testid="comments-section">{props.ticketTitle}</div>
  ),
}));

const BASE_PROPS = {
  ticketId: 1,
  ticketTitle: "Fix the login page",
  referenceId: "TCK-1",
  attachments: [],
  client: null,
  assignees: [],
  organization: null,
};

it("uses the full subtitle and shows comments by default", () => {
  render(<TicketOverviewCard {...BASE_PROPS} />);
  expect(
    screen.getByText("Description, attachments, and the discussion around this ticket."),
  ).toBeInTheDocument();
  expect(screen.getByTestId("comments-section")).toBeInTheDocument();
});

it("uses the shorter subtitle and hides comments when hideComments is set", () => {
  render(<TicketOverviewCard {...BASE_PROPS} hideComments />);
  expect(screen.getByText("Description and attachments.")).toBeInTheDocument();
  expect(screen.queryByTestId("comments-section")).toBeNull();
});

it("passes description and ticketTitle through to the sub-sections", () => {
  render(<TicketOverviewCard {...BASE_PROPS} description="It redirects to a blank page" />);
  expect(screen.getByTestId("description-section")).toHaveTextContent(
    "It redirects to a blank page",
  );
  expect(screen.getByTestId("attachments-section")).toHaveTextContent(
    "Fix the login page",
  );
});
