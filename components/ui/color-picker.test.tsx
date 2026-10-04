import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "./color-picker";

async function openPicker(value = "#3B82C4") {
  render(<ColorPicker value={value} onChange={jest.fn()} />);
  await userEvent.click(screen.getByLabelText("Choose color"));
}

it("shows a swatch trigger with the current color", () => {
  render(<ColorPicker value="#3B82C4" onChange={jest.fn()} />);
  const trigger = screen.getByLabelText("Choose color");
  expect(trigger.style.backgroundColor).toBe("rgb(59, 130, 196)");
});

it("renders the default preset colors when opened", async () => {
  await openPicker();
  // 10 default presets.
  expect(screen.getAllByRole("button", { name: /^#/ })).toHaveLength(10);
});

it("renders custom preset colors when given", async () => {
  render(
    <ColorPicker value="#000000" onChange={jest.fn()} presetColors={["#111111", "#222222"]} />,
  );
  await userEvent.click(screen.getByLabelText("Choose color"));
  expect(screen.getAllByRole("button", { name: /^#/ })).toHaveLength(2);
});

it("shows a checkmark on the preset matching the current value (case-insensitive)", async () => {
  render(<ColorPicker value="#3b82c4" onChange={jest.fn()} />);
  await userEvent.click(screen.getByLabelText("Choose color"));
  const selected = screen.getByRole("button", { name: "#3B82C4" });
  expect(selected.querySelector("svg")).not.toBeNull();
});

it("calls onChange and closes when a preset is clicked", async () => {
  const onChange = jest.fn();
  render(<ColorPicker value="#000000" onChange={onChange} />);
  await userEvent.click(screen.getByLabelText("Choose color"));
  await userEvent.click(screen.getByRole("button", { name: "#3B82C4" }));
  expect(onChange).toHaveBeenCalledWith("#3B82C4");
});

it("applies a custom hex typed into the input", async () => {
  const onChange = jest.fn();
  render(<ColorPicker value="#000000" onChange={onChange} />);
  await userEvent.click(screen.getByLabelText("Choose color"));
  const input = screen.getByPlaceholderText("#3B82C4");
  await userEvent.clear(input);
  await userEvent.type(input, "#abc123");
  await userEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(onChange).toHaveBeenCalledWith("#abc123");
});

it("accepts a hex typed without a leading #", async () => {
  const onChange = jest.fn();
  render(<ColorPicker value="#000000" onChange={onChange} />);
  await userEvent.click(screen.getByLabelText("Choose color"));
  const input = screen.getByPlaceholderText("#3B82C4");
  await userEvent.clear(input);
  await userEvent.type(input, "abc");
  await userEvent.keyboard("{Enter}");
  expect(onChange).toHaveBeenCalledWith("#abc");
});

it("shows an error for an invalid hex and does not call onChange", async () => {
  const onChange = jest.fn();
  render(<ColorPicker value="#000000" onChange={onChange} />);
  await userEvent.click(screen.getByLabelText("Choose color"));
  const input = screen.getByPlaceholderText("#3B82C4");
  await userEvent.clear(input);
  await userEvent.type(input, "zzzzzz");
  await userEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(screen.getByText(/Enter a valid hex code/)).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

it("clears the error once the user edits the input again", async () => {
  render(<ColorPicker value="#000000" onChange={jest.fn()} />);
  await userEvent.click(screen.getByLabelText("Choose color"));
  const input = screen.getByPlaceholderText("#3B82C4");
  await userEvent.clear(input);
  await userEvent.type(input, "zz");
  await userEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(screen.getByText(/Enter a valid hex code/)).toBeInTheDocument();

  await userEvent.type(input, "z");
  expect(screen.queryByText(/Enter a valid hex code/)).toBeNull();
});

it("applies a custom className to the trigger", () => {
  render(<ColorPicker value="#000000" onChange={jest.fn()} className="my-extra" />);
  expect(screen.getByLabelText("Choose color").className).toContain("my-extra");
});
