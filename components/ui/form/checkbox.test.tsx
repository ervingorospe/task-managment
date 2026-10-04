import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import Checkbox from "./checkbox";

interface FormValues {
  sendEmailNotif: boolean;
}

function TestForm({ defaultValue = false }: { defaultValue?: boolean }) {
  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { sendEmailNotif: defaultValue },
  });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <Checkbox name="sendEmailNotif" control={control} label="Send email notifications" />
      <span data-testid="valid">{String(formState.isValid)}</span>
    </form>
  );
}

it("reflects the field's default value", () => {
  render(<TestForm defaultValue />);
  expect(screen.getByRole("checkbox")).toBeChecked();
});

it("updates the field value when toggled", async () => {
  render(<TestForm defaultValue={false} />);
  const checkbox = screen.getByRole("checkbox");
  expect(checkbox).not.toBeChecked();
  await userEvent.click(checkbox);
  expect(checkbox).toBeChecked();
});

it("marks the field touched on blur", async () => {
  render(<TestForm defaultValue={false} />);
  const checkbox = screen.getByRole("checkbox");
  await userEvent.click(checkbox);
  await userEvent.tab();
  expect(checkbox).not.toHaveFocus();
});
