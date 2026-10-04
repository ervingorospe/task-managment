import { render, screen, fireEvent } from "@testing-library/react";
import Avatar from "./avatar";

it("renders initials from first and last name when there's no src", () => {
  render(<Avatar firstName="Jane" lastName="Doe" />);
  expect(screen.getByText("JD")).toBeInTheDocument();
});

it("falls back to the first two letters of firstName when there's no lastName", () => {
  render(<Avatar firstName="Jane" />);
  expect(screen.getByText("JA")).toBeInTheDocument();
});

it("renders an image when src is provided", () => {
  render(<Avatar firstName="Jane" lastName="Doe" src="https://cdn/avatar.png" />);
  expect(screen.getByRole("img")).toBeInTheDocument();
});

it("falls back to initials if the image fails to load", () => {
  render(<Avatar firstName="Jane" lastName="Doe" src="https://cdn/broken.png" />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByText("JD")).toBeInTheDocument();
});

it("uses the md size by default and applies a custom className", () => {
  render(<Avatar firstName="Jane" lastName="Doe" className="my-extra" />);
  const el = screen.getByLabelText("Jane Doe");
  expect(el.className).toContain("h-8 w-8");
  expect(el.className).toContain("my-extra");
});

it("applies the requested size", () => {
  render(<Avatar firstName="Jane" lastName="Doe" size="xl" />);
  expect(screen.getByLabelText("Jane Doe").className).toContain("h-20 w-20");
});

it("falls back to an empty initial for an empty firstName", () => {
  render(<Avatar firstName="" lastName="Doe" />);
  expect(screen.getByText("D")).toBeInTheDocument();
});

it("falls back to an empty second initial for a single-character firstName with no lastName", () => {
  render(<Avatar firstName="J" />);
  expect(screen.getByText("J")).toBeInTheDocument();
});
