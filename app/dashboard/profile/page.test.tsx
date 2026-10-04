import { render, screen } from "@testing-library/react";
import ProfilePage from "./page";

jest.mock("@/components/profile/profile-client", () => function MockProfileClient() {
  return <div>Profile Client</div>;
});

it("renders the profile client", () => {
  render(<ProfilePage />);
  expect(screen.getByText("Profile Client")).toBeInTheDocument();
});
