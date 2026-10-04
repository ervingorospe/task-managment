// Same isomorphic-dompurify ESM chain issue as lib/helper/render-description.test.ts.
jest.mock("isomorphic-dompurify", () => ({
  sanitize: (html: string, options?: { ALLOWED_TAGS?: string[] }) =>
    options?.ALLOWED_TAGS?.length === 0 ? html.replace(/<[^>]*>/g, "") : html,
}));

import { render, screen } from "@testing-library/react";
import TicketDescriptionCell from "./ticket-description-cell";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";

function attachment(overrides: Partial<TicketAttachment> = {}): TicketAttachment {
  return { id: 1, name: "screenshot.png", url: "https://cdn/screenshot.png", size: 1024, ...overrides };
}

it("shows a dash placeholder when there's no description", () => {
  render(<TicketDescriptionCell ticketId={1} attachments={[]} />);
  expect(screen.getByText("—")).toBeInTheDocument();
});

it("shows a dash placeholder for a whitespace-only description", () => {
  render(<TicketDescriptionCell ticketId={1} description="   " attachments={[]} />);
  expect(screen.getByText("—")).toBeInTheDocument();
});

it("renders the plain-text description", () => {
  render(
    <TicketDescriptionCell
      ticketId={1}
      description="**It redirects to a blank page**"
      attachments={[]}
    />,
  );
  expect(screen.getByText(/It redirects to a blank page/)).toBeInTheDocument();
});

it("renders no attachment list when there are none", () => {
  render(<TicketDescriptionCell ticketId={1} description="x" attachments={[]} />);
  expect(screen.queryByRole("link")).toBeNull();
});

it("lists attachments with their size in KB", () => {
  render(
    <TicketDescriptionCell
      ticketId={1}
      description="x"
      attachments={[attachment({ size: 500 * 1024 })]}
    />,
  );
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "https://cdn/screenshot.png");
  expect(link).toHaveTextContent("500 KB");
});

it("shows an attachment's size in MB when at least 1MB", () => {
  render(
    <TicketDescriptionCell
      ticketId={1}
      description="x"
      attachments={[attachment({ size: 2.5 * 1024 * 1024 })]}
    />,
  );
  expect(screen.getByRole("link")).toHaveTextContent("2.5 MB");
});

it("opens attachments in a new tab safely", () => {
  render(
    <TicketDescriptionCell ticketId={1} description="x" attachments={[attachment()]} />,
  );
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});
