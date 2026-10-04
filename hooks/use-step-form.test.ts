import { renderHook, waitFor, act } from "@testing-library/react";
import { z } from "zod";
import { useStepForm } from "./use-step-form";
import { useStepper } from "@/providers/stepper.provider";

jest.mock("@/providers/stepper.provider", () => ({ useStepper: jest.fn() }));

const mockedUseStepper = useStepper as jest.Mock;

const schema = z.object({
  name: z.string().min(2, "Too short"),
});

const setStepValid = jest.fn();
const updateFormData = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

it("seeds default values when the stepper has no saved formData yet", async () => {
  mockedUseStepper.mockReturnValue({ formData: {}, setStepValid, updateFormData });
  const { result } = renderHook(() => useStepForm(schema, { name: "" }));
  expect(result.current.getValues("name")).toBe("");
  await waitFor(() => expect(updateFormData).toHaveBeenCalledWith({ name: "" }));
});

it("merges saved stepper formData over the schema defaults (fixes data loss on Back)", () => {
  mockedUseStepper.mockReturnValue({
    formData: { name: "Acme Studio" },
    setStepValid,
    updateFormData,
  });
  const { result } = renderHook(() => useStepForm(schema, { name: "" }));
  expect(result.current.getValues("name")).toBe("Acme Studio");
});

it("reports validity to the stepper via setStepValid", async () => {
  mockedUseStepper.mockReturnValue({ formData: {}, setStepValid, updateFormData });
  renderHook(() => useStepForm(schema, { name: "" }));
  // Empty name fails the schema's min(2) — should report invalid.
  await waitFor(() => expect(setStepValid).toHaveBeenCalledWith(false));
});

it("reports valid once the field satisfies the schema", async () => {
  mockedUseStepper.mockReturnValue({
    formData: { name: "Acme Studio" },
    setStepValid,
    updateFormData,
  });
  renderHook(() => useStepForm(schema, { name: "" }));
  await waitFor(() => expect(setStepValid).toHaveBeenCalledWith(true));
});

it("pushes every field change back into the shared stepper formData", async () => {
  mockedUseStepper.mockReturnValue({ formData: {}, setStepValid, updateFormData });
  const { result } = renderHook(() => useStepForm(schema, { name: "" }));
  updateFormData.mockClear();

  act(() => {
    result.current.setValue("name", "Acme Studio", { shouldDirty: true });
  });

  await waitFor(() =>
    expect(updateFormData).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Acme Studio" }),
    ),
  );
});
