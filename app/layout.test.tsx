import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "./layout";

jest.mock("@/providers/auth-provider", () => ({
  AuthProvider: function MockAuthProvider(props: any) {
    return <div>{props.children}</div>;
  },
}));
jest.mock("@/providers/toast-provider", () => ({
  ToastProvider: function MockToastProvider(props: any) {
    return <div>{props.children}</div>;
  },
}));
jest.mock("@/components/ui/toaster", () => ({ Toaster: function MockToaster() {
  return <div>Toaster</div>;
} }));

it("exposes the page metadata", () => {
  expect(metadata.title).toBe("Ticketing — Work Orders");
  expect(metadata.description).toBe("Ticketing, projects, and reporting for teams.");
});

it("wraps children in the auth and toast providers and renders the toaster", () => {
  render(
    <RootLayout>
      <div>Page Content</div>
    </RootLayout>,
  );
  expect(screen.getByText("Page Content")).toBeInTheDocument();
  expect(screen.getByText("Toaster")).toBeInTheDocument();
});
