import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./search-input";

it("renders a text input and forwards props (value, onChange, placeholder)", async () => {
  const onChange = jest.fn();
  render(<SearchInput value="" onChange={onChange} placeholder="Search tickets" />);
  const input = screen.getByPlaceholderText("Search tickets");
  expect(input).toHaveAttribute("type", "text");
  await userEvent.type(input, "a");
  expect(onChange).toHaveBeenCalled();
});

it("merges a custom className onto the input", () => {
  render(<SearchInput value="" onChange={jest.fn()} className="my-extra" />);
  expect(screen.getByRole("textbox").className).toContain("my-extra");
});

it("applies containerClassName to the wrapper", () => {
  const { container } = render(
    <SearchInput value="" onChange={jest.fn()} containerClassName="my-wrapper" />,
  );
  expect((container.firstChild as HTMLElement).className).toContain("my-wrapper");
});

it("works without a containerClassName", () => {
  const { container } = render(<SearchInput value="" onChange={jest.fn()} />);
  expect((container.firstChild as HTMLElement).className).toBe("relative");
});
