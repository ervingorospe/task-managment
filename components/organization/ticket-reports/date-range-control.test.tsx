import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangeControl } from "./date-range-control";

function dateInputs() {
  const inputs = document.querySelectorAll('input[type="date"]');
  return [inputs[0] as HTMLInputElement, inputs[1] as HTMLInputElement];
}

describe("DateRangeControl", () => {
  it("renders empty from/to inputs and no clear button when value is empty", () => {
    render(<DateRangeControl value={{ from: null, to: null }} onChange={jest.fn()} />);

    const inputs = screen.getAllByDisplayValue("");
    expect(inputs).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Clear date range" })).not.toBeInTheDocument();
  });

  it("shows the clear button when from is set and clears both fields on click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<DateRangeControl value={{ from: "2026-01-01", to: null }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Clear date range" }));

    expect(onChange).toHaveBeenCalledWith({ from: null, to: null });
  });

  it("shows the clear button when only to is set", () => {
    render(<DateRangeControl value={{ from: null, to: "2026-02-01" }} onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Clear date range" })).toBeInTheDocument();
  });

  it("calls onChange with the updated from date, preserving to", () => {
    const onChange = jest.fn();
    render(<DateRangeControl value={{ from: null, to: "2026-02-01" }} onChange={onChange} />);

    const [from] = dateInputs();
    fireEvent.change(from, { target: { value: "2026-01-15" } });

    expect(onChange).toHaveBeenCalledWith({ from: "2026-01-15", to: "2026-02-01" });
  });

  it("calls onChange with the updated to date, preserving from", () => {
    const onChange = jest.fn();
    render(<DateRangeControl value={{ from: "2026-01-01", to: null }} onChange={onChange} />);

    const [, to] = dateInputs();
    fireEvent.change(to, { target: { value: "2026-02-20" } });

    expect(onChange).toHaveBeenCalledWith({ from: "2026-01-01", to: "2026-02-20" });
  });

  it("treats clearing the from input's value as null", () => {
    const onChange = jest.fn();
    render(<DateRangeControl value={{ from: "2026-01-01", to: null }} onChange={onChange} />);

    const [from] = dateInputs();
    fireEvent.change(from, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({ from: null, to: null });
  });

  it("treats clearing the to input's value as null", () => {
    const onChange = jest.fn();
    render(<DateRangeControl value={{ from: null, to: "2026-02-20" }} onChange={onChange} />);

    const [, to] = dateInputs();
    fireEvent.change(to, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({ from: null, to: null });
  });
});
