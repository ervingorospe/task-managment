"use client";

import { useForm } from "react-hook-form";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/buttons/button";
import Select from "@/components/ui/form/select";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { updateOrganizationInviteExpiration } from "@/lib/api/organizations";

const expirationOptions = [
  { value: "1_hour", label: "1 hour" },
  { value: "2_hours", label: "2 hours" },
  { value: "6_hours", label: "6 hours" },
  { value: "1_day", label: "1 day" },
  { value: "2_days", label: "2 days" },
  { value: "1_week", label: "1 week" },
  { value: "1_month", label: "1 month" },
];

interface InviteSettingsSectionProps {
  orgId: number;
  initialExpiration?: string;
}

interface InviteSettingsValues {
  expiration: string;
}

export default function InviteSettingsSection({
  orgId,
  initialExpiration = "1_day",
}: InviteSettingsSectionProps) {
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const { control, handleSubmit } = useForm<InviteSettingsValues>({
    defaultValues: {
      expiration: initialExpiration,
    },
  });

  async function handleUpdate(values: InviteSettingsValues) {
    try {
      await updateOrganizationInviteExpiration(orgId, values.expiration);
    } catch (error) {
      notifyApiError(toast, error, "Failed to update invite settings");
      return;
    }
    showAlert("Invite settings updated");
  }

  return (
    <Card
      title="Invites"
      subtitle="Control how long sent invitations remain valid."
      banner={
        alert && (
          <InlineAlert
            message={alert.message}
            variant={alert.variant}
            onDismiss={dismissAlert}
          />
        )
      }
    >
      <form
        onSubmit={handleSubmit(handleUpdate)}
        className="flex items-end gap-3"
      >
        <div className="flex-1">
          <Select
            icon={ChevronDown}
            iconPosition="right"
            name="expiration"
            control={control}
            label="Invite Expiration"
            options={expirationOptions}
          />
        </div>

        <Button type="submit" variant="secondary">
          Update
        </Button>
      </form>
    </Card>
  );
}
