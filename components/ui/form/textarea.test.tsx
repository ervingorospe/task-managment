import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Textarea from "./textarea";

const schema = z.object({ description: z.string().min(1, "Description is required") });
type FormValues = z.infer<typeof schema>;

function TestForm(props: Partial<React.ComponentProps<typeof Textarea<FormValues>>> = {}) {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: "" },
  });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <Textarea name="description" control={control} {...props} />
      <button type="submit">Submit</button>
    </form>
  );
}

it("renders without a label when none is given", () => {
  render(<TestForm />);
  expect(screen.queryByText("(optional)")).toBeNull();
});

it("renders a label and an '(optional)' marker when set", () => {
  render(<TestForm label="Description" optional />);
  expect(screen.getByText("Description")).toBeInTheDocument();
  expect(screen.getByText("(optional)")).toBeInTheDocument();
});

it("updates the field value as the user types", async () => {
  render(<TestForm label="Description" />);
  const textarea = screen.getByLabelText("Description");
  await userEvent.type(textarea, "It redirects to a blank page");
  expect(textarea).toHaveValue("It redirects to a blank page");
});

it("shows the validation error on submit instead of helperText", async () => {
  render(<TestForm label="Description" helperText="Markdown supported" />);
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByText("Description is required")).toBeInTheDocument();
  expect(screen.queryByText("Markdown supported")).toBeNull();
});

it("shows helperText when there's no error", () => {
  render(<TestForm label="Description" helperText="Markdown supported" />);
  expect(screen.getByText("Markdown supported")).toBeInTheDocument();
});

it("applies the focused border style while focused, and reverts on blur", async () => {
  render(<TestForm label="Description" />);
  const textarea = screen.getByLabelText("Description");
  await userEvent.click(textarea);
  expect(textarea.className).toContain("border-accent-text");
  await userEvent.tab();
  expect(textarea.className).toContain("border-line");
});

it("forwards a custom onFocus handler", async () => {
  const onFocus = jest.fn();
  render(<TestForm label="Description" onFocus={onFocus} />);
  await userEvent.click(screen.getByLabelText("Description"));
  expect(onFocus).toHaveBeenCalled();
});

it("renders an empty string value when the field value is undefined", () => {
  function UndefinedValueForm() {
    const { control } = useForm<FormValues>({ resolver: zodResolver(schema) });
    return <Textarea name="description" control={control} label="Description" />;
  }
  render(<UndefinedValueForm />);
  expect(screen.getByLabelText("Description")).toHaveValue("");
});
