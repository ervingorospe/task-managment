import { useEffect } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z, ZodType } from "zod";
import { useStepper } from "@/providers/stepper.provider";

export function useStepForm<TSchema extends ZodType<FieldValues>>(
  schema: TSchema,
  defaultValues: DefaultValues<z.infer<TSchema>>,
) {
  type FormValues = z.infer<TSchema>;
  const { formData, setStepValid, updateFormData } = useStepper();

  // Merge in anything already saved from a previous visit to this step
  // (see #2 below — this is what fixes data loss on Back).
  const mergedDefaults = {
    ...defaultValues,
    ...formData,
  } as DefaultValues<FormValues>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any) as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: mergedDefaults,
  });

  const { watch, trigger, getValues, formState } = form;

  useEffect(() => {
    trigger();
  }, [trigger]);

  useEffect(() => {
    setStepValid(formState.isValid);
  }, [formState.isValid, setStepValid]);

  // Seeds the step's current values into the shared formData right away —
  // `watch`'s callback below only fires on a *change*, so a step whose
  // defaults (an auto-picked timezone, preloaded roles/tags) are simply
  // accepted without ever being touched would otherwise never make it into
  // formData, and silently drop out of the payload built on the final step.
  useEffect(() => {
    updateFormData(getValues() as Partial<FormValues>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = watch((values) => {
      updateFormData(values as Partial<FormValues>);
    });
    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  return form;
}
