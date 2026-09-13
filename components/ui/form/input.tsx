"use client";

import {
  useController,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from "react-hook-form";
import type { ComponentProps, ComponentType } from "react";
import type { LucideProps } from "lucide-react";

type InputProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = Omit<ComponentProps<"input">, "name" | "defaultValue"> & {
  name: N;
  control: Control<T>;
  label?: string;
  optional?: boolean;
  helperText?: string;
  icon?: ComponentType<LucideProps> | undefined;
  iconPosition?: "left" | "right";
  defaultValue?: FieldPathValue<T, N>;
};

export default function Input<T extends FieldValues>({
  name,
  control,
  label,
  optional = false,
  helperText,
  icon: Icon,
  iconPosition = "left",
  defaultValue,
  className,
  ...props
}: InputProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue,
  });

  const hasError = Boolean(error);

  const inputPadding = Icon
    ? iconPosition === "left"
      ? "pl-10"
      : "pr-10"
    : "";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-1 block text-sm font-medium text-ink"
        >
          {label}

          {optional ? (
            <span className="ml-1 text-ink-faint">(optional)</span>
          ) : (
            <span className="ml-1 text-danger">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {Icon && iconPosition === "left" && (
          <Icon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
        )}

        <input
          {...props}
          {...field}
          id={name}
          value={field.value ?? ""}
          className={[
            "w-full rounded border bg-surface px-3 py-2 text-sm text-ink",
            "placeholder:text-ink-faint",
            "focus:border-accent-text focus:outline-none",
            "disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-muted",
            hasError ? "border-danger" : "border-line",
            inputPadding,
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {Icon && iconPosition === "right" && (
          <Icon
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-danger">{error.message}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-ink-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
