import { render, screen } from "@testing-library/react";
import { MarketingFooter } from "./marketing-footer";

it("renders the product and account links", () => {
  render(<MarketingFooter />);
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/services");
  expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
});

it("renders the current year in the copyright line", () => {
  render(<MarketingFooter />);
  const year = new Date().getFullYear().toString();
  expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
});
