import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailChipInput } from "./email-chip-input";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";

jest.mock("@/providers/auth-provider", () => {
  const actual = jest.requireActual("@/providers/auth-provider");
  return { ...actual, useAuth: jest.fn() };
});

const mockedUseAuth = useAuth as jest.Mock;

function withPermissions(actions: string[]) {
  mockedUseAuth.mockReturnValue({
    activeMembership: {
      role: {
        rules: actions.map((action, i) => ({ id: i, action, name: action, desc: "", categoryId: 1 })),
      },
    },
    isPersonalMode: false,
  });
}

beforeEach(() => {
  withPermissions([PERMISSIONS.MEMBER_INVITE]);
});

function renderInput(overrides: Partial<React.ComponentProps<typeof EmailChipInput>> = {}) {
  const onAdd = jest.fn();
  render(<EmailChipInput atCapacity={false} capacity={10} onAdd={onAdd} {...overrides} />);
  return { onAdd };
}

it("renders nothing without member.invite", () => {
  withPermissions([]);
  renderInput();
  expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
});

it("shows a placeholder before any chip is added", () => {
  renderInput();
  expect(screen.getByPlaceholderText("Type an email and press space")).toBeInTheDocument();
});

describe("committing a chip", () => {
  it("commits a chip on space and clears the placeholder", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com ");
    expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("commits a chip on Enter", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com{Enter}");
    expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  });

  it("ignores committing an empty value", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, " ");
    expect(screen.queryByText(/isn't a valid email/)).toBeNull();
  });

  it("shows an error for an invalid email", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "not-an-email ");
    expect(screen.getByText('"not-an-email" isn\'t a valid email')).toBeInTheDocument();
  });

  it("shows a length error for an overly long email", () => {
    // maxLength on the real input blocks typing past 50 chars, so the only
    // way a value this long reaches commitChip is a programmatic set
    // (e.g. a paste) that bypasses the browser's own maxlength enforcement.
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    const longLocal = "a".repeat(45);
    fireEvent.change(input, { target: { value: `${longLocal}@a.com` } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Email must be 50 characters or fewer")).toBeInTheDocument();
  });

  it("clears a previous error once the input changes again", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "not-an-email ");
    expect(screen.getByText('"not-an-email" isn\'t a valid email')).toBeInTheDocument();
    await userEvent.type(input, "x");
    expect(screen.queryByText('"not-an-email" isn\'t a valid email')).toBeNull();
  });

  it("does not add a duplicate chip", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com ");
    await userEvent.type(input, "jane@acmestudio.com ");
    expect(screen.getAllByText("jane@acmestudio.com")).toHaveLength(1);
  });

  it("removes the last chip on Backspace from an empty input", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com ");
    await userEvent.type(input, "{Backspace}");
    expect(screen.queryByText("jane@acmestudio.com")).toBeNull();
  });

  it("does nothing on Backspace when there's text in the input", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com partial{Backspace}");
    expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  });

  it("removes a chip via its own remove button", async () => {
    renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com ");
    await userEvent.click(screen.getByRole("button", { name: "Remove jane@acmestudio.com" }));
    expect(screen.queryByText("jane@acmestudio.com")).toBeNull();
  });
});

describe("adding", () => {
  it("adds every committed chip plus a pending valid value in the input", async () => {
    const { onAdd } = renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com ");
    await userEvent.type(input, "marco@acmestudio.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith(["jane@acmestudio.com", "marco@acmestudio.com"]);
    expect(screen.queryByText("jane@acmestudio.com")).toBeNull();
    expect(input).toHaveValue("");
  });

  it("drops an invalid pending value and adds only the valid chips", async () => {
    const { onAdd } = renderInput();
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com ");
    await userEvent.type(input, "not-valid");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith(["jane@acmestudio.com"]);
  });

  it("shows an error and does not call onAdd when nothing valid is present", async () => {
    const { onAdd } = renderInput();
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Add at least one valid email")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows a capacity error and does not call onAdd when at capacity", async () => {
    const { onAdd } = renderInput({ atCapacity: true });
    const input = screen.getByPlaceholderText("Type an email and press space");
    await userEvent.type(input, "jane@acmestudio.com ");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Reached invite capacity")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
