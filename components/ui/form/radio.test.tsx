import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Radio from "./radio";

describe("uncontrolled (no name/control)", () => {
  it("defaults to unchecked", () => {
    render(<Radio value="personal" label="Personal" />);
    expect(screen.getByRole("radio")).not.toBeChecked();
  });

  it("reflects the checked prop", () => {
    render(<Radio value="personal" label="Personal" checked />);
    expect(screen.getByRole("radio")).toBeChecked();
  });

  it("calls onCheckedChange when checked", async () => {
    const onCheckedChange = jest.fn();
    render(
      <Radio value="personal" label="Personal" onCheckedChange={onCheckedChange} />,
    );
    await userEvent.click(screen.getByRole("radio"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("forwards a custom onChange handler", async () => {
    const onChange = jest.fn();
    render(<Radio value="personal" label="Personal" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio"));
    expect(onChange).toHaveBeenCalled();
  });


  it("forwards a custom onBlur handler", async () => {
    const onBlur = jest.fn();
    render(<Radio value="personal" label="Personal" onBlur={onBlur} />);
    screen.getByRole("radio").focus();
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });
});

describe("controlled (name + control from react-hook-form)", () => {
  const schema = z.object({ accountType: z.enum(["personal", "organization"]) });
  type FormValues = z.infer<typeof schema>;

  function TestForm() {
    const { control, formState } = useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { accountType: "personal" },
    });
    return (
      <form>
        <Radio name="accountType" control={control} value="personal" label="Personal" />
        <Radio
          name="accountType"
          control={control}
          value="organization"
          label="Organization"
        />
        {formState.errors.accountType && (
          <span>{formState.errors.accountType.message}</span>
        )}
      </form>
    );
  }

  it("checks the option matching the field's current value", () => {
    render(<TestForm />);
    expect(screen.getByRole("radio", { name: "Personal" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Organization" })).not.toBeChecked();
  });

  it("updates the field value and unchecks the other option when selected", async () => {
    render(<TestForm />);
    await userEvent.click(screen.getByRole("radio", { name: "Organization" }));
    expect(screen.getByRole("radio", { name: "Organization" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Personal" })).not.toBeChecked();
  });

  it("does not crash when a controlled radio is blurred", async () => {
    render(<TestForm />);
    screen.getByRole("radio", { name: "Personal" }).focus();
    await userEvent.tab();
  });

});

it("renders a description alongside the label", () => {
  render(
    <Radio value="personal" label="Personal" description="Your own standalone space" />,
  );
  expect(screen.getByText("Your own standalone space")).toBeInTheDocument();
});

it("renders with no label or description", () => {
  render(<Radio value="personal" />);
  expect(screen.getByRole("radio")).toBeInTheDocument();
});

it("applies a disabled, dimmed style", () => {
  const { container } = render(<Radio value="personal" label="Personal" disabled />);
  expect(screen.getByRole("radio")).toBeDisabled();
  expect(container.querySelector("label")?.className).toContain("cursor-not-allowed");
});
