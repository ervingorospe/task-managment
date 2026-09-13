import type { ComponentProps, ComponentType } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import type { LucideProps } from "lucide-react";

export const FIELD_TYPES = {
  INPUT: "input",
  TEXTAREA: "textarea",
} as const;

type InputField<T extends FieldValues> = {
  fieldType: typeof FIELD_TYPES.INPUT;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  optional?: boolean;
  type?: ComponentProps<"input">["type"];
  icon?: ComponentType<LucideProps>;
  iconPosition?: "left" | "right";
};

type TextareaField<T extends FieldValues> = {
  fieldType: typeof FIELD_TYPES.TEXTAREA;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  optional?: boolean;
  rows?: number;
};

export type InputFieldConfig<T extends FieldValues> =
  | InputField<T>
  | TextareaField<T>;
