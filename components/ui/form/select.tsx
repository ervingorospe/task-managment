"use client";

import type { ComponentType, ComponentProps } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from "react-hook-form";

type SelectIconProps = {
  size?: string | number;
  className?: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = Omit<ComponentProps<"select">, "name" | "defaultValue"> & {
  name: N;
  control: Control<T>;
  label?: string;
  optional?: boolean;
  helperText?: string;
  options: SelectOption[];
  icon?: ComponentType<SelectIconProps>;
  iconPosition?: "left" | "right";
  defaultValue?: FieldPathValue<T, N>;
};

export default function Select<T extends FieldValues>({
  name,
  control,
  label,
  optional,
  helperText,
  options,
  icon: Icon,
  iconPosition = "left",
  defaultValue,
  className,
  ...props
}: SelectProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue,
  });

  const hasError = Boolean(error);

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-ink">
          {label}

          {optional ? (
            <span className="ml-1 text-ink-faint">(optional)</span>
          ) : (
            <span className="ml-1 text-danger">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className={[
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted",
              iconPosition === "left" ? "left-3" : "right-3",
            ].join(" ")}
          />
        )}

        <select
          {...props}
          ref={field.ref}
          name={field.name}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          className={[
            "w-full appearance-none rounded border bg-surface py-2 text-sm text-ink",
            "focus:border-accent-text focus:outline-none",
            "disabled:bg-canvas disabled:text-ink-muted",
            iconPosition === "left" && Icon ? "pl-9 pr-8" : "",
            iconPosition === "right" && Icon ? "pl-3 pr-9" : "",
            !Icon ? "px-3" : "",
            hasError ? "border-danger" : "border-line",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-danger">{error.message}</p>
      ) : (
        helperText && (
          <p className="mt-1 text-xs text-ink-muted">{helperText}</p>
        )
      )}
    </div>
  );
}
