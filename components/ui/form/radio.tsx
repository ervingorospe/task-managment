"use client";

import { ComponentProps, ReactNode } from "react";
import {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
  useController,
} from "react-hook-form";

type RadioProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = Omit<
  ComponentProps<"input">,
  "name" | "type" | "defaultValue" | "value"
> & {
  name?: N;
  control?: Control<T>;
  value: FieldPathValue<T, N> | string | number;
  label?: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export default function Radio<T extends FieldValues>({
  name,
  control,
  value,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
  onChange,
  onBlur,
  ...props
}: RadioProps<T>) {
  const controller =
    name && control
      ? useController({
          name,
          control,
        })
      : null;

  const isChecked = controller
    ? controller.field.value === value
    : (checked ?? false);

  return (
    <div>
      <label
        className={[
          "flex items-start gap-2",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          {...props}
          ref={controller?.field.ref}
          type="radio"
          value={String(value)}
          checked={isChecked}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.checked) {
              controller?.field.onChange(value);
              onCheckedChange?.(true);
            }

            onChange?.(event);
          }}
          onBlur={(event) => {
            controller?.field.onBlur();
            onBlur?.(event);
          }}
          className={[
            "mt-0.5 h-4 w-4 border-line",
            "accent-accent",
            "focus:ring-2 focus:ring-accent/20",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <span className="block text-sm font-medium text-ink">
                {label}
              </span>
            )}

            {description && (
              <span className="block text-xs text-ink-muted">
                {description}
              </span>
            )}
          </div>
        )}
      </label>

      {controller?.fieldState.error?.message && (
        <p className="mt-1 text-xs text-danger">
          {controller.fieldState.error.message}
        </p>
      )}
    </div>
  );
}
