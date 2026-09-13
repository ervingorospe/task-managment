"use client";

import { type ComponentProps, useState } from "react";
import {
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  useController,
} from "react-hook-form";

export type FormTextareaProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = Omit<
  ComponentProps<"textarea">,
  "name" | "defaultValue" | "value" | "onChange" | "onBlur"
> & {
  name: N;
  control: Control<T>;
  label?: string | null;
  helperText?: string;
  optional?: boolean;
  defaultValue?: FieldPathValue<T, N>;
};

export default function Textarea<T extends FieldValues>({
  name,
  control,
  label,
  helperText,
  optional = false,
  defaultValue,
  className = "",
  ...props
}: FormTextareaProps<T>) {
  const [isFocused, setIsFocused] = useState(false);

  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue,
  });

  const hasError = Boolean(error);
  const textareaId = String(name);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-ink"
        >
          {label}

          {optional && (
            <span className="ml-1 font-normal text-ink-faint">(optional)</span>
          )}
        </label>
      )}

      <textarea
        {...props}
        id={textareaId}
        name={field.name}
        ref={field.ref}
        value={field.value ?? ""}
        onChange={field.onChange}
        onBlur={(event) => {
          setIsFocused(false);
          field.onBlur();
        }}
        onFocus={(event) => {
          setIsFocused(true);
          props.onFocus?.(event);
        }}
        aria-invalid={hasError}
        aria-describedby={
          hasError
            ? `${textareaId}-error`
            : helperText
              ? `${textareaId}-helper`
              : undefined
        }
        className={[
          "w-full resize-none rounded border bg-surface px-3 py-2",
          "text-sm text-ink placeholder:text-ink-faint",
          "outline-none transition-colors",
          "disabled:cursor-not-allowed disabled:bg-canvas",
          "disabled:text-ink-muted",
          hasError
            ? "border-danger focus:border-danger"
            : isFocused
              ? "border-accent-text"
              : "border-line",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {hasError ? (
        <p id={`${textareaId}-error`} className="text-xs text-danger">
          {error?.message}
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-xs text-ink-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
