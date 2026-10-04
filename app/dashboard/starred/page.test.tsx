import { render, screen } from "@testing-library/react";
import PersonalStarredPage from "./page";

jest.mock(
  "@/components/ticket/personal-tickets-page-client",
  () =>
    function MockPersonalTicketsPageClient(props: { starredOnly?: boolean }) {
      return <div>Personal Tickets Client (starredOnly={String(props.starredOnly)})</div>;
    },
);

it("renders the personal tickets client with starredOnly set", () => {
  render(<PersonalStarredPage />);
  expect(screen.getByText("Personal Tickets Client (starredOnly=true)")).toBeInTheDocument();
});
