import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tooltip from "./tooltip";

it("hides the label by default", () => {
  render(
    <Tooltip label="Delete">
      <button>X</button>
    </Tooltip>,
  );
  expect(screen.queryByText("Delete")).toBeNull();
});

it("shows the label on hover and hides it again on mouse leave", async () => {
  render(
    <Tooltip label="Delete">
      <button>X</button>
    </Tooltip>,
  );
  const wrapper = screen.getByText("X").closest("span")!;
  await userEvent.hover(wrapper);
  expect(screen.getByText("Delete")).toBeInTheDocument();

  await userEvent.unhover(wrapper);
  expect(screen.queryByText("Delete")).toBeNull();
});
