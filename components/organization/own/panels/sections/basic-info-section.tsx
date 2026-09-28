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
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";

import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import {
  basicInfoSchema,
  type BasicInfoValues,
} from "@/lib/schemas/organization.schema";
import { FIELD_TYPES, InputFieldConfig } from "@/lib/types/form.type";
import Link from "next/link";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { updateOrganizationBasicInfo } from "@/lib/api/organizations";
interface BasicInformationProps {
  organization: OrganizationDetail;
}

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
    maxLength: 50,
  },
  {
    fieldType: FIELD_TYPES.INPUT,
    name: "email",
    label: "Email",
    placeholder: "hello@acme.com",
    optional: true,
    type: "email",
    iconPosition: "right",
    maxLength: 50,
  },
  {
    fieldType: FIELD_TYPES.INPUT,
    name: "website",
    label: "Website",
    placeholder: "https://acme.com",
    optional: true,
    type: "text",
    iconPosition: "right",
    maxLength: 50,
  },
  {
    fieldType: FIELD_TYPES.TEXTAREA,
    name: "organizationDesc",
    label: "Description",
    placeholder: "What does your organization do?",
    optional: true,
    rows: 3,
    maxLength: 300,
  },
];

export default function BasicInformation({
  organization,
}: BasicInformationProps) {
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const [isEditing, setIsEditing] = useState(false);

  const [displayInfo, setDisplayInfo] = useState({
    organizationName: organization.organizationName,
    email: organization.email ?? "",
    website: organization.website ?? "",
    organizationDesc: organization.organizationDesc ?? "",
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

  async function onSave(values: BasicInfoValues) {
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

    try {
      await updateOrganizationBasicInfo(organization.id, patch);
    } catch (error) {
      notifyApiError(toast, error, "Failed to update organization information");
      return;
    }

    setDisplayInfo((prev) => ({
      ...prev,
      ...patch,
    }));

    reset({
      ...displayInfo,
      ...patch,
    });

    setIsEditing(false);
    showAlert("Organization information updated");
  }

  return (
    <Card
      title="Basic Information"
      subtitle="General information about your organization."
      banner={
        alert && (
          <InlineAlert
            message={alert.message}
            variant={alert.variant}
            onDismiss={dismissAlert}
          />
        )
      }
      headerActions={
        isEditing ? (
          <Can action={PERMISSIONS.ORGANIZATION_UPDATE_BASIC_INFO}>
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
          </Can>
        ) : (
          <Can action={PERMISSIONS.ORGANIZATION_UPDATE_BASIC_INFO}>
            <Button type="button" variant="secondary" onClick={startEditing}>
              <Pencil size={14} className="mr-1.5" />
              Edit
            </Button>
          </Can>
        )
      }
    >
      {isEditing ? (
        <Can action={PERMISSIONS.ORGANIZATION_UPDATE_BASIC_INFO}>
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
                    maxLength={field.maxLength}
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
                  maxLength={field.maxLength}
                  className="sm:col-span-2"
                />
              );
            })}
          </form>
        </Can>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <PropertyRow label="Organization Name" variant="plain">
            <p className="text-sm text-ink">{displayInfo.organizationName}</p>
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
              {displayInfo.organizationDesc || "No description provided"}
            </p>
          </PropertyRow>
        </div>
      )}
    </Card>
  );
}
