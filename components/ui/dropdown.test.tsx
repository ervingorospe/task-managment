import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dropdown from "./dropdown";

function mockViewport(width: number, height: number) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    value: height,
    configurable: true,
  });
}

function mockTriggerRect(rect: Partial<DOMRect>) {
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 100,
    height: 20,
    x: 0,
    y: 0,
    toJSON: () => {},
    ...rect,
  }));
}

beforeEach(() => {
  mockViewport(1024, 768);
  mockTriggerRect({ top: 100, bottom: 120, left: 50, right: 150 });
});

it("does not render the panel until opened", () => {
  render(
    <Dropdown trigger={<span>Open</span>}>
      <div>Panel content</div>
    </Dropdown>,
  );
  expect(screen.queryByText("Panel content")).toBeNull();
});

it("opens the panel on trigger click and calls onOpen once", async () => {
  const onOpen = jest.fn();
  render(
    <Dropdown trigger={<span>Open</span>} onOpen={onOpen}>
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByText("Panel content")).toBeInTheDocument();
  expect(onOpen).toHaveBeenCalledTimes(1);

  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.queryByText("Panel content")).toBeNull();
  expect(onOpen).toHaveBeenCalledTimes(1);

  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  expect(onOpen).toHaveBeenCalledTimes(2);
});

it("opens on Enter and Space, ignores other keys", async () => {
  render(
    <Dropdown trigger={<span>Open</span>}>
      <div>Panel content</div>
    </Dropdown>,
  );
  const trigger = screen.getByRole("button", { name: "Open" });
  trigger.focus();

  await userEvent.keyboard("{a}");
  expect(screen.queryByText("Panel content")).toBeNull();

  await userEvent.keyboard("{Enter}");
  expect(screen.getByText("Panel content")).toBeInTheDocument();

  await userEvent.keyboard(" ");
  expect(screen.queryByText("Panel content")).toBeNull();
});

it("closes when clicking outside the trigger and panel", async () => {
  render(
    <div>
      <Dropdown trigger={<span>Open</span>}>
        <div>Panel content</div>
      </Dropdown>
      <button>Outside</button>
    </div>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  expect(screen.getByText("Panel content")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Outside" }));
  await waitFor(() => expect(screen.queryByText("Panel content")).toBeNull());
});

it("stays open when clicking an arbitrary non-item element inside the panel", async () => {
  render(
    <Dropdown trigger={<span>Open</span>}>
      <div>
        <span>Just some text</span>
      </div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await userEvent.click(screen.getByText("Just some text"));
  expect(screen.getByText("Just some text")).toBeInTheDocument();
});

it("ignores a mousedown event whose target isn't a Node", async () => {
  render(
    <Dropdown trigger={<span>Open</span>}>
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const event = new MouseEvent("mousedown", { bubbles: true });
  Object.defineProperty(event, "target", { value: null });
  document.dispatchEvent(event);
  expect(screen.getByText("Panel content")).toBeInTheDocument();
});

it("fades the panel in (visible=true) shortly after opening", async () => {
  render(
    <Dropdown trigger={<span>Open</span>}>
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await waitFor(() => {
    expect(screen.getByRole("menu").className).toContain("opacity-100");
  });
});

it("closes on Escape", async () => {
  render(
    <Dropdown trigger={<span>Open</span>}>
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByText("Panel content")).toBeNull());
});

it("flips to the top when there isn't enough room below but there is above", async () => {
  // Viewport 768 tall, trigger near the bottom: spaceBelow (768-720=48) is
  // under ESTIMATED_PANEL_HEIGHT and spaceAbove (700) is bigger — flips up.
  mockTriggerRect({ top: 700, bottom: 720, left: 50, right: 150 });
  render(
    <Dropdown trigger={<span>Open</span>} side="bottom">
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await waitFor(() => {
    const panel = document.querySelector("[data-floating-panel]") as HTMLElement;
    expect(panel.style.top).toBe("");
    expect(panel.style.bottom).not.toBe("");
  });
});

it("keeps the bottom side when there's enough room below", async () => {
  render(
    <Dropdown trigger={<span>Open</span>} side="bottom">
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await waitFor(() => {
    const panel = document.querySelector("[data-floating-panel]") as HTMLElement;
    expect(panel.style.bottom).toBe("");
    expect(panel.style.top).not.toBe("");
  });
});

it("flips to the bottom when side='top' doesn't have enough room above", async () => {
  mockTriggerRect({ top: 20, bottom: 40, left: 50, right: 150 });
  render(
    <Dropdown trigger={<span>Open</span>} side="top">
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await waitFor(() => {
    const panel = document.querySelector("[data-floating-panel]") as HTMLElement;
    expect(panel.style.top).not.toBe("");
  });
});

it("aligns to the left edge when align='start'", async () => {
  render(
    <Dropdown trigger={<span>Open</span>} align="start">
      <div>Panel content</div>
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await waitFor(() => {
    const panel = document.querySelector("[data-floating-panel]") as HTMLElement;
    expect(panel.style.left).not.toBe("");
    expect(panel.style.right).toBe("");
  });
});

it("applies isWidthFull's w-full class to the wrapper", () => {
  const { container } = render(
    <Dropdown trigger={<span>Open</span>} isWidthFull>
      <div>Panel content</div>
    </Dropdown>,
  );
  expect(container.querySelector(".w-full")).not.toBeNull();
});

describe("Dropdown.DropdownItem", () => {
  it("renders as a link when href is given, and closes on click", async () => {
    const onClick = jest.fn();
    render(
      <Dropdown trigger={<span>Open</span>}>
        <Dropdown.DropdownItem href="/tickets/1" onClick={onClick}>
          View ticket
        </Dropdown.DropdownItem>
      </Dropdown>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const item = screen.getByRole("menuitem", { name: "View ticket" });
    expect(item.tagName).toBe("A");
    await userEvent.click(item);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a button when href is omitted, and closes on click", async () => {
    const onClick = jest.fn();
    render(
      <Dropdown trigger={<span>Open</span>}>
        <Dropdown.DropdownItem onClick={onClick}>Delete</Dropdown.DropdownItem>
      </Dropdown>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const item = screen.getByRole("menuitem", { name: "Delete" });
    expect(item.tagName).toBe("BUTTON");
    await userEvent.click(item);
    expect(onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menuitem")).toBeNull());
  });

  it("applies danger styling when danger is set", async () => {
    render(
      <Dropdown trigger={<span>Open</span>}>
        <Dropdown.DropdownItem danger>Delete</Dropdown.DropdownItem>
      </Dropdown>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("menuitem", { name: "Delete" }).className).toContain(
      "text-danger",
    );
  });

  it("works without an onClick handler", async () => {
    render(
      <Dropdown trigger={<span>Open</span>}>
        <Dropdown.DropdownItem>No handler</Dropdown.DropdownItem>
      </Dropdown>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "No handler" }));
  });
});

it("Dropdown.DropdownSeparator renders a divider", async () => {
  render(
    <Dropdown trigger={<span>Open</span>}>
      <Dropdown.DropdownSeparator />
    </Dropdown>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  // Portaled to document.body, not inside RTL's mount container.
  expect(document.querySelector('[role="menu"] > .border-t')).not.toBeNull();
});
