import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import Input from "./input";

const schema = z.object({ email: z.string().min(1, "Email is required") });
type FormValues = z.infer<typeof schema>;

function TestForm(props: Partial<React.ComponentProps<typeof Input<FormValues>>> = {}) {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <Input name="email" control={control} {...props} />
      <button type="submit">Submit</button>
    </form>
  );
}

it("renders an empty string value when the field value is undefined", () => {
  function UndefinedValueForm() {
    const { control } = useForm<FormValues>({ resolver: zodResolver(schema) });
    return <Input name="email" control={control} label="Email" />;
  }
  render(<UndefinedValueForm />);
  expect(screen.getByLabelText(/Email/)).toHaveValue("");
});

it("renders without a label when none is given", () => {
  render(<TestForm />);
  expect(screen.queryByText("*")).toBeNull();
});

it("renders a required marker for a labeled field by default", () => {
  render(<TestForm label="Email" />);
  expect(screen.getByText("Email")).toBeInTheDocument();
  expect(screen.getByText("*")).toBeInTheDocument();
});

it("renders an '(optional)' marker when optional is set", () => {
  render(<TestForm label="Email" optional />);
  expect(screen.getByText("(optional)")).toBeInTheDocument();
});

it("updates the field value as the user types", async () => {
  render(<TestForm label="Email" />);
  const input = screen.getByLabelText(/Email/);
  await userEvent.type(input, "jane@acmestudio.com");
  expect(input).toHaveValue("jane@acmestudio.com");
});

it("shows the validation error on submit instead of helperText", async () => {
  render(<TestForm label="Email" helperText="We'll never share this" />);
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByText("Email is required")).toBeInTheDocument();
  expect(screen.queryByText("We'll never share this")).toBeNull();
});

it("shows helperText when there's no error", () => {
  render(<TestForm label="Email" helperText="We'll never share this" />);
  expect(screen.getByText("We'll never share this")).toBeInTheDocument();
});

it("renders a left-positioned icon by default", () => {
  const { container } = render(<TestForm label="Email" icon={Mail} />);
  expect(container.querySelector(".left-3")).not.toBeNull();
  expect(screen.getByLabelText(/Email/).className).toContain("pl-10");
});

it("renders a right-positioned icon when requested", () => {
  const { container } = render(<TestForm label="Email" icon={Mail} iconPosition="right" />);
  expect(container.querySelector(".right-3")).not.toBeNull();
  expect(screen.getByLabelText(/Email/).className).toContain("pr-10");
});

it("forwards native input props like placeholder and disabled", () => {
  render(<TestForm label="Email" placeholder="jane@acmestudio.com" disabled />);
  const input = screen.getByLabelText(/Email/);
  expect(input).toHaveAttribute("placeholder", "jane@acmestudio.com");
  expect(input).toBeDisabled();
});
