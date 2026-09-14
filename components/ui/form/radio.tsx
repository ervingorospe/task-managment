"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
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

interface RadioContentProps {
  value: string | number;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  ref?: React.Ref<HTMLInputElement>;
  inputProps: Omit<
    ComponentProps<"input">,
    "name" | "type" | "defaultValue" | "value"
  >;
}

function RadioContent({
  value,
  label,
  description,
  disabled,
  className,
  checked,
  onChange,
  onBlur,
  ref,
  inputProps,
}: RadioContentProps) {
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
          {...inputProps}
          ref={ref}
          type="radio"
          value={String(value)}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
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
    </div>
  );
}

function ControlledRadio<T extends FieldValues>({
  name,
  control,
  value,
  label,
  description,
  disabled,
  className,
  onCheckedChange,
  onChange,
  onBlur,
  ...props
}: RadioProps<T>) {
  const { field, fieldState } = useController({
    name: name!,
    control: control!,
  });

  const isChecked = field.value === value;

  return (
    <div>
      <RadioContent
        value={value}
        label={label}
        description={description}
        disabled={disabled}
        className={className}
        checked={isChecked}
        ref={field.ref}
        inputProps={props}
        onChange={(event) => {
          if (event.target.checked) {
            field.onChange(value);
            onCheckedChange?.(true);
          }

          onChange?.(event);
        }}
        onBlur={(event) => {
          field.onBlur();
          onBlur?.(event);
        }}
      />

      {fieldState.error?.message && (
        <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
      )}
    </div>
  );
}

function UncontrolledRadio<T extends FieldValues>({
  value,
  label,
  description,
  checked = false,
  onCheckedChange,
  disabled,
  className,
  onChange,
  onBlur,
  ...props
}: RadioProps<T>) {
  return (
    <RadioContent
      value={value}
      label={label}
      description={description}
      disabled={disabled}
      className={className}
      checked={checked}
      inputProps={props}
      onChange={(event) => {
        if (event.target.checked) {
          onCheckedChange?.(true);
        }

        onChange?.(event);
      }}
      onBlur={onBlur}
    />
  );
}

export default function Radio<T extends FieldValues>(props: RadioProps<T>) {
  if (props.name && props.control) {
    return <ControlledRadio {...props} />;
  }

  return <UncontrolledRadio {...props} />;
}
