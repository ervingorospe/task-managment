"use client";

import { useForm } from "react-hook-form";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/buttons/button";
import Checkbox from "@/components/ui/form/checkbox";
import { useToast } from "@/providers/toast-provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { updateOrganizationNotifications } from "@/lib/api/organizations";

interface NotificationSettingsSectionProps {
  orgId: number;
  initialValue?: boolean;
}

interface NotificationSettingsValues {
  receiveEmails: boolean;
}

export default function NotificationSettingsSection({
  orgId,
  initialValue = true,
}: NotificationSettingsSectionProps) {
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const { control, handleSubmit } = useForm<NotificationSettingsValues>({
    defaultValues: {
      receiveEmails: initialValue,
    },
  });

  async function handleUpdate(values: NotificationSettingsValues) {
    try {
      await updateOrganizationNotifications(orgId, values.receiveEmails);
    } catch (error) {
      notifyApiError(toast, error, "Failed to update notification settings");
      return;
    }
    showAlert("Notification settings updated");
  }

  return (
    <Card
      title="Notifications"
      subtitle="Choose how this organization is notified."
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
        className="flex items-center justify-between"
      >
        <Checkbox
          name="receiveEmails"
          control={control}
          label="Receive email notifications"
        />

        <Button type="submit" variant="secondary">
          Update
        </Button>
      </form>
    </Card>
  );
}
