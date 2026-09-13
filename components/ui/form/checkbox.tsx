"use client";

import { ComponentProps, ReactNode } from "react";
import {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
  useController,
} from "react-hook-form";

type FormCheckboxProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = Omit<ComponentProps<"input">, "name" | "type" | "defaultValue"> & {
  name?: N;
  control?: Control<T>;
  label?: ReactNode;
  description?: ReactNode;
  optional?: boolean;
  defaultValue?: FieldPathValue<T, N>;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export default function Checkbox<T extends FieldValues>({
  name,
  control,
  label,
  description,
  optional,
  defaultValue,
  checked,
  onCheckedChange,
  disabled,
  className,
  onChange,
  onBlur,
  ...props
}: FormCheckboxProps<T>) {
  const controller =
    name && control
      ? useController({
          name,
          control,
          defaultValue,
        })
      : null;

  const hasError = Boolean(controller?.fieldState.error);

  const value = controller ? Boolean(controller.field.value) : Boolean(checked);

  return (
    <div>
      <label
        className={[
          "flex items-center gap-2",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          {...props}
          ref={controller?.field.ref}
          type="checkbox"
          checked={value}
          disabled={disabled}
          onChange={(event) => {
            const nextChecked = event.target.checked;

            controller?.field.onChange(nextChecked);
            onCheckedChange?.(nextChecked);
            onChange?.(event);
          }}
          onBlur={(event) => {
            controller?.field.onBlur();
            onBlur?.(event);
          }}
          className={[
            "mt-0.5 h-4 w-4 rounded border-line",
            "accent-accent",
            "focus:ring-2 focus:ring-accent/20",
            hasError ? "border-danger" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <span className="text-sm text-ink">
                {label}

                {optional && (
                  <span className="ml-1 font-normal text-ink-faint">
                    (optional)
                  </span>
                )}
              </span>
            )}

            {description && (
              <p className="text-xs text-ink-muted">{description}</p>
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
