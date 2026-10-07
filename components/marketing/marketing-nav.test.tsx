import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { MarketingNav } from "./marketing-nav";

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));

const mockedUsePathname = usePathname as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUsePathname.mockReturnValue("/");
  mockedUseAuth.mockReturnValue({ isAuthenticated: false });
});

it("renders the primary nav links with their hrefs", () => {
  render(<MarketingNav />);
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/services");
  expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
});

it("highlights the link matching the current pathname", () => {
  mockedUsePathname.mockReturnValue("/about");
  render(<MarketingNav />);
  expect(screen.getByRole("link", { name: "About" })).toHaveClass("text-ink");
  expect(screen.getByRole("link", { name: "Home" })).toHaveClass("text-ink-muted");
});

it("shows Log in / Get started when not authenticated", () => {
  render(<MarketingNav />);
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/signup");
  expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
});

it("shows a Dashboard link when authenticated", () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  render(<MarketingNav />);
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
  expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
});

it("opens and closes the mobile menu, duplicating the nav links", async () => {
  render(<MarketingNav />);
  expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);

  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(2);

  await userEvent.click(screen.getByRole("button", { name: "Close menu" }));
  expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);
});

it("closes the mobile menu when a mobile nav link is clicked", async () => {
  render(<MarketingNav />);
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const aboutLinks = screen.getAllByRole("link", { name: "About" });
  await userEvent.click(aboutLinks[aboutLinks.length - 1]);
  expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);
});

it("closes the mobile menu when the mobile Dashboard CTA is clicked", async () => {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true });
  render(<MarketingNav />);
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });
  await userEvent.click(dashboardLinks[dashboardLinks.length - 1]);
  expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);
});

it("closes the mobile menu when the mobile Log in CTA is clicked", async () => {
  render(<MarketingNav />);
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const loginLinks = screen.getAllByRole("link", { name: "Log in" });
  await userEvent.click(loginLinks[loginLinks.length - 1]);
  expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);
});

it("closes the mobile menu when the mobile Get started CTA is clicked", async () => {
  render(<MarketingNav />);
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const ctaLinks = screen.getAllByRole("link", { name: "Get started" });
  await userEvent.click(ctaLinks[ctaLinks.length - 1]);
  expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);
});
