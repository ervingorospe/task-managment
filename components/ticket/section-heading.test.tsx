import { render, screen } from "@testing-library/react";
import { Ticket } from "lucide-react";
import { SectionHeading } from "./section-heading";

it("renders the icon and children", () => {
  render(<SectionHeading icon={Ticket}>Description</SectionHeading>);
  expect(screen.getByText("Description")).toBeInTheDocument();
});
