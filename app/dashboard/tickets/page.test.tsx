import { render, screen } from "@testing-library/react";
import PersonalTicketsPage from "./page";

jest.mock(
  "@/components/ticket/personal-tickets-page-client",
  () =>
    function MockPersonalTicketsPageClient(props: { starredOnly?: boolean }) {
      return <div>Personal Tickets Client (starredOnly={String(props.starredOnly)})</div>;
    },
);

it("renders the personal tickets client without starredOnly", () => {
  render(<PersonalTicketsPage />);
  expect(screen.getByText("Personal Tickets Client (starredOnly=undefined)")).toBeInTheDocument();
});
