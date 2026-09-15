"use client";

import {
  useController,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from "react-hook-form";
import CheckboxBase from "./checkbox-base";
import type { ComponentProps, ReactNode } from "react";

type CheckboxProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = Omit<ComponentProps<"input">, "name" | "type" | "defaultValue"> & {
  name: N;
  control: Control<T>;
  label?: ReactNode;
  description?: ReactNode;
  optional?: boolean;
  defaultValue?: FieldPathValue<T, N>;
};

export default function Checkbox<T extends FieldValues>({
  name,
  control,
  defaultValue,
  onChange,
  onBlur,
  ...props
}: CheckboxProps<T>) {
  // Called unconditionally every render — name/control are required props
  // now, not optional, so there's no branch to violate Rules of Hooks with.
  const {
    field,
    fieldState: { error },
  } = useController({ name, control, defaultValue });

  return (
    <CheckboxBase
      {...props}
      ref={field.ref}
      checked={Boolean(field.value)}
      onChange={(e) => {
        field.onChange(e.target.checked);
        onChange?.(e);
      }}
      onBlur={(e) => {
        field.onBlur();
        onBlur?.(e);
      }}
      error={error?.message}
    />
  );
}
