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

  const { watch, trigger, formState } = form;

  useEffect(() => {
    trigger();
  }, [trigger]);

  useEffect(() => {
    setStepValid(formState.isValid);
  }, [formState.isValid, setStepValid]);

  useEffect(() => {
    const subscription = watch((values) => {
      updateFormData(values as Partial<FormValues>);
    });
    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  return form;
}
