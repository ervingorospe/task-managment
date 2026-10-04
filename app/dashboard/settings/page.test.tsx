import { render, screen } from "@testing-library/react";
import AccountSettingsPage from "./page";

jest.mock("@/components/account-settings/account-settings-client", () => function MockAccountSettingsClient() {
  return <div>Account Settings Client</div>;
});

it("renders the account settings client", () => {
  render(<AccountSettingsPage />);
  expect(screen.getByText("Account Settings Client")).toBeInTheDocument();
});
