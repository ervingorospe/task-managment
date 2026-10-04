import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import Select from "./select";

const OPTIONS = [
  { value: "to-do", label: "To Do" },
  { value: "done", label: "Done" },
];

const schema = z.object({ tagId: z.string().min(1, "Select a status") });
type FormValues = z.infer<typeof schema>;

function TestForm(props: Partial<React.ComponentProps<typeof Select<FormValues>>> = {}) {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tagId: "" },
  });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <Select name="tagId" control={control} options={OPTIONS} {...props} />
      <button type="submit">Submit</button>
    </form>
  );
}

it("renders every option", () => {
  render(<TestForm label="Status" />);
  expect(screen.getByRole("option", { name: "To Do" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Done" })).toBeInTheDocument();
});

it("renders a required marker for a labeled field by default", () => {
  render(<TestForm label="Status" />);
  expect(screen.getByText("*")).toBeInTheDocument();
});

it("renders an '(optional)' marker when set", () => {
  render(<TestForm label="Status" optional />);
  expect(screen.getByText("(optional)")).toBeInTheDocument();
});

it("renders without a label when none is given", () => {
  render(<TestForm />);
  expect(screen.queryByText("*")).toBeNull();
});

it("updates the field value on selection", async () => {
  render(<TestForm label="Status" />);
  const select = screen.getByRole("combobox");
  await userEvent.selectOptions(select, "done");
  expect(select).toHaveValue("done");
});

it("shows the validation error on submit instead of helperText", async () => {
  render(<TestForm label="Status" helperText="Pick the ticket's status" />);
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByText("Select a status")).toBeInTheDocument();
  expect(screen.queryByText("Pick the ticket's status")).toBeNull();
});

it("shows helperText when there's no error", () => {
  render(<TestForm label="Status" helperText="Pick the ticket's status" />);
  expect(screen.getByText("Pick the ticket's status")).toBeInTheDocument();
});

it("renders a left-positioned icon by default", () => {
  render(<TestForm label="Status" icon={ChevronDown} />);
  expect(screen.getByRole("combobox").className).toContain("pl-9");
});

it("renders a right-positioned icon when requested", () => {
  render(<TestForm label="Status" icon={ChevronDown} iconPosition="right" />);
  expect(screen.getByRole("combobox").className).toContain("pr-9");
});

it("applies plain horizontal padding when there's no icon", () => {
  render(<TestForm label="Status" />);
  expect(screen.getByRole("combobox").className).toContain("px-3");
});

it("does not crash when the field value is undefined (falls back to '')", () => {
  // A native <select> with no option valued "" falls back to selecting
  // the first option — this just verifies the `field.value ?? ""` guard
  // doesn't pass `undefined` straight to a controlled <select>, which
  // React would warn about turning into an uncontrolled input.
  function UndefinedValueForm() {
    const { control } = useForm<FormValues>({ resolver: zodResolver(schema) });
    return <Select name="tagId" control={control} options={OPTIONS} label="Status" />;
  }
  render(<UndefinedValueForm />);
  expect(screen.getByRole("combobox")).toBeInTheDocument();
});
