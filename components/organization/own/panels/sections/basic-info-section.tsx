"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Mail, Pencil, X, Check } from "lucide-react";

import Input from "@/components/ui/form/input";
import Textarea from "@/components/ui/form/textarea";
import { Button } from "@/components/ui/buttons/button";
import Card from "@/components/ui/card";
import PropertyRow from "@/components/ui/property-row";
import { useToast } from "@/providers/toast-provider";

import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import {
  basicInfoSchema,
  type BasicInfoValues,
} from "@/lib/schemas/organization.schema";
import { FIELD_TYPES, InputFieldConfig } from "@/lib/types/form.type";
import Link from "next/link";
import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";
interface BasicInformationProps {
  organization: OrganizationDetail;
}

const defaultValues: BasicInfoValues = {
  name: "",
  email: "",
  website: "",
  description: "",
};

const inputFields: InputFieldConfig<BasicInfoValues>[] = [
  {
    fieldType: FIELD_TYPES.INPUT,
    name: "name",
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
    iconPosition: "right",
  },
  {
    fieldType: FIELD_TYPES.TEXTAREA,
    name: "description",
    label: "Description",
    placeholder: "What does your organization do?",
    optional: true,
    rows: 3,
  },
];

export default function BasicInformation({
  organization,
}: BasicInformationProps) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [displayInfo, setDisplayInfo] = useState({
    name: organization.organizationName,
    email: organization.email ?? "",
    website: organization.website ?? "",
    description: organization.organizationDesc ?? "",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      ...defaultValues,
      ...displayInfo,
    },
  });

  function startEditing() {
    reset(displayInfo);
    setIsEditing(true);
  }

  function cancelEditing() {
    reset(displayInfo);
    setIsEditing(false);
  }

  function onSave(values: BasicInfoValues) {
    const changedFields = Object.keys(dirtyFields) as Array<
      keyof BasicInfoValues
    >;

    if (changedFields.length === 0) {
      setIsEditing(false);
      return;
    }

    const patch = changedFields.reduce<Partial<BasicInfoValues>>((acc, key) => {
      acc[key] = values[key];
      return acc;
    }, {});

    // TODO: PATCH /organizations/:id
    console.log("PATCH payload", patch);

    setDisplayInfo((prev) => ({
      ...prev,
      ...patch,
    }));

    reset({
      ...displayInfo,
      ...patch,
    });

    setIsEditing(false);
    toast("Organization information updated");
  }

  return (
    <Card
      title="Basic Information"
      subtitle="General information about your organization."
      headerActions={
        isEditing ? (
          <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={cancelEditing}>
                <X size={14} className="mr-1.5" />
                Cancel
              </Button>

              <Button type="button" onClick={handleSubmit(onSave)}>
                <Check size={14} className="mr-1.5" />
                Save
              </Button>
            </div>
          </AccountTypeGuard>
        ) : (
          <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
            <Button type="button" variant="secondary" onClick={startEditing}>
              <Pencil size={14} className="mr-1.5" />
              Edit
            </Button>
          </AccountTypeGuard>
        )
      }
    >
      {isEditing ? (
        <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
          <form
            onSubmit={handleSubmit(onSave)}
            className="grid gap-5 sm:grid-cols-2"
          >
            {inputFields.map((field) => {
              if (field.fieldType === FIELD_TYPES.INPUT) {
                return (
                  <Input
                    key={field.name}
                    name={field.name}
                    control={control}
                    label={field.label}
                    placeholder={field.placeholder}
                    optional={field.optional}
                    type={field.type}
                    icon={field.icon}
                    iconPosition={field.iconPosition}
                  />
                );
              }

              return (
                <Textarea
                  key={field.name}
                  name={field.name}
                  control={control}
                  label={field.label}
                  placeholder={field.placeholder}
                  optional={field.optional}
                  rows={field.rows}
                  className="sm:col-span-2"
                />
              );
            })}
          </form>
        </AccountTypeGuard>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <PropertyRow label="Organization Name" variant="plain">
            <p className="text-sm text-ink">{displayInfo.name}</p>
          </PropertyRow>

          <PropertyRow label="Email" variant="plain">
            <Mail size={14} className="text-ink-faint" />
            <p className="text-sm text-ink">
              {displayInfo.email || "Not provided"}
            </p>
          </PropertyRow>

          <Link href={displayInfo.website ?? "#"} target="_blank">
            <PropertyRow label="Website" variant="plain">
              <Globe
                size={14}
                className={
                  displayInfo.website ? "text-accent-text" : "text-ink-muted"
                }
              />
              <p
                className={`text-sm ${
                  displayInfo.website ? "text-accent-text" : "text-ink-muted"
                }`}
              >
                {displayInfo.website || "Not provided"}
              </p>
            </PropertyRow>
          </Link>

          <PropertyRow
            label="Description"
            variant="plain"
            className="sm:col-span-2"
          >
            <p className="text-sm text-ink">
              {displayInfo.description || "No description provided"}
            </p>
          </PropertyRow>
        </div>
      )}
    </Card>
  );
}
