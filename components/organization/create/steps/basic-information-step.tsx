"use client";

import {
  basicInfoSchema,
  type BasicInfoValues,
} from "@/lib/schemas/organization.schema";
import { useStepForm } from "@/hooks/use-step-form";
import { Input, Textarea } from "@/components/ui/form";
import { FIELD_TYPES, InputFieldConfig } from "@/lib/types/form.type";

const defaultValues: BasicInfoValues = {
  organizationName: "",
  email: "",
  website: "",
  organizationDesc: "",
};

const inputFields: InputFieldConfig<BasicInfoValues>[] = [
  {
    fieldType: FIELD_TYPES.INPUT,
    name: "organizationName",
    label: "Organization Name",
    placeholder: "Acme Studio",
    type: "text",
  },
  {
    fieldType: FIELD_TYPES.INPUT,
    name: "email",
    label: "Email",
    placeholder: "hello@acme.com",
    optional: true,
    type: "email",
    iconPosition: "right",
  },
  {
    fieldType: FIELD_TYPES.INPUT,
    name: "website",
    label: "Website",
    placeholder: "https://acme.com",
    optional: true,
    type: "text",
  },
  {
    fieldType: FIELD_TYPES.TEXTAREA,
    name: "organizationDesc",
    label: "Description",
    placeholder: "What does your organization do?",
    optional: true,
    rows: 3,
  },
];

export default function BasicInformationStep() {
  const { control } = useStepForm(basicInfoSchema, defaultValues);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-ink">Basic Information</h2>

        <p className="mt-1 text-sm text-ink-muted">
          Tell us a little about your organization.
        </p>
      </div>

      {inputFields.map((field) => {
        if (field.fieldType === FIELD_TYPES.TEXTAREA) {
          return (
            <Textarea
              key={field.name}
              name={field.name}
              control={control}
              label={field.label}
              optional={field.optional}
              placeholder={field.placeholder}
              rows={field.rows}
            />
          );
        }

        return (
          <Input
            key={field.name}
            name={field.name}
            control={control}
            label={field.label}
            optional={field.optional}
            placeholder={field.placeholder}
            type={field.type}
            icon={field.icon}
            iconPosition={field.iconPosition}
          />
        );
      })}
    </div>
  );
}
