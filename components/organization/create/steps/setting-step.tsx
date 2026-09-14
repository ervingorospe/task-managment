"use client";

import Image from "next/image";
import { useMemo, type ChangeEvent } from "react";
import { ChevronDown, ImagePlus, X } from "lucide-react";

import {
  settingsSchema,
  type SettingsValues,
} from "@/lib/schemas/organization.schema";
import { useStepForm } from "@/hooks/use-step-form";
import { getSystemTimezone, getTimezoneList } from "@/lib/helper/timezones";
import { Select } from "@/components/ui/form";

export default function OrganizationSettingsStep() {
  const systemTimezone = useMemo(getSystemTimezone, []);
  const timezones = useMemo(getTimezoneList, []);

  const defaultValues: SettingsValues = {
    logo: "",
    timezone: systemTimezone,
  };

  const { control, setValue, watch } = useStepForm(
    settingsSchema,
    defaultValues,
  );

  // Derived from the form field itself, not separate local state.
  // This survives remounts when navigating Back/Next.
  const logoPreview = watch("logo");

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setValue("logo", url, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function clearLogo() {
    setValue("logo", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-ink">
          Organization Settings
        </h2>

        <p className="mt-1 text-sm text-ink-muted">
          Customize how your organization is displayed and configured.
        </p>
      </div>

      {/* Logo */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Logo <span className="text-ink-faint">(optional)</span>
        </label>

        <div className="flex items-center gap-3">
          {/* Logo Preview */}
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded border border-dashed border-line bg-canvas">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Organization logo preview"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <ImagePlus size={18} className="text-ink-faint" />
            )}
          </div>

          {/* Upload */}
          <label className="cursor-pointer rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:bg-canvas">
            Upload
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </label>

          {/* Remove */}
          {logoPreview && (
            <button
              type="button"
              onClick={clearLogo}
              className="flex items-center gap-1 text-sm text-ink-muted hover:text-danger"
            >
              <X size={14} />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Timezone */}
      <Select
        name="timezone"
        control={control}
        label="Timezone"
        icon={ChevronDown}
        iconPosition="right"
        options={timezones.map((timezone) => ({
          value: timezone,
          label: timezone,
        }))}
        helperText={`Detected from your device: ${systemTimezone}. You can change this later in organization settings.`}
      />
    </div>
  );
}
