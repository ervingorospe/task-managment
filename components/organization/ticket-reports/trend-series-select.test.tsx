import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrendSeriesSelect } from "./trend-series-select";
import type { TrendSelection } from "@/lib/helper/ticket-reports";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

function tag(overrides: Partial<TagDetail> = {}): TagDetail {
  return {
    id: 1,
    tagName: "Bug",
    color: "#ff0000",
    isDefault: false,
    ...overrides,
  };
}

function selection(overrides: Partial<TrendSelection> = {}): TrendSelection {
  return { created: false, dueDate: false, tagIds: [], ...overrides };
}

describe("TrendSeriesSelect", () => {
  it("renders a checkbox per tag plus Created and Due date", () => {
    const tags = [tag({ id: 1, tagName: "Bug" }), tag({ id: 2, tagName: "Feature" })];
    render(<TrendSeriesSelect value={selection()} onChange={jest.fn()} tags={tags} />);

    expect(screen.getByLabelText("Created")).toBeInTheDocument();
    expect(screen.getByLabelText("Due date")).toBeInTheDocument();
    expect(screen.getByLabelText("Bug")).toBeInTheDocument();
    expect(screen.getByLabelText("Feature")).toBeInTheDocument();
  });

  it("reflects checked state from the value prop", () => {
    const tags = [tag({ id: 1, tagName: "Bug" })];
    render(
      <TrendSeriesSelect
        value={selection({ created: true, tagIds: [1] })}
        onChange={jest.fn()}
        tags={tags}
      />,
    );

    expect(screen.getByLabelText("Created")).toBeChecked();
    expect(screen.getByLabelText("Due date")).not.toBeChecked();
    expect(screen.getByLabelText("Bug")).toBeChecked();
  });

  it("toggles created on click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TrendSeriesSelect value={selection()} onChange={onChange} tags={[]} />);

    await user.click(screen.getByLabelText("Created"));

    expect(onChange).toHaveBeenCalledWith(selection({ created: true }));
  });

  it("toggles dueDate on click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TrendSeriesSelect value={selection()} onChange={onChange} tags={[]} />);

    await user.click(screen.getByLabelText("Due date"));

    expect(onChange).toHaveBeenCalledWith(selection({ dueDate: true }));
  });

  it("adds a tag id when its checkbox is checked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const tags = [tag({ id: 1, tagName: "Bug" })];
    render(<TrendSeriesSelect value={selection()} onChange={onChange} tags={tags} />);

    await user.click(screen.getByLabelText("Bug"));

    expect(onChange).toHaveBeenCalledWith(selection({ tagIds: [1] }));
  });

  it("removes a tag id when its checkbox is unchecked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const tags = [tag({ id: 1, tagName: "Bug" })];
    render(
      <TrendSeriesSelect value={selection({ tagIds: [1] })} onChange={onChange} tags={tags} />,
    );

    await user.click(screen.getByLabelText("Bug"));

    expect(onChange).toHaveBeenCalledWith(selection({ tagIds: [] }));
  });

  it("shows 'nothing selected' in the print-only summary when nothing is picked", () => {
    render(<TrendSeriesSelect value={selection()} onChange={jest.fn()} tags={[]} />);

    expect(screen.getByText("Plotting: nothing selected")).toBeInTheDocument();
  });

  it("lists created, due date, and tag names in the print-only summary", () => {
    const tags = [tag({ id: 1, tagName: "Bug" }), tag({ id: 2, tagName: "Feature" })];
    render(
      <TrendSeriesSelect
        value={selection({ created: true, dueDate: true, tagIds: [1] })}
        onChange={jest.fn()}
        tags={tags}
      />,
    );

    expect(screen.getByText("Plotting: Created, Due date, Bug")).toBeInTheDocument();
  });
});
