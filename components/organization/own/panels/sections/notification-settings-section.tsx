"use client";

import { useForm } from "react-hook-form";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/form/checkbox";

interface NotificationSettingsSectionProps {
  initialValue?: boolean;
}

interface NotificationSettingsValues {
  receiveEmails: boolean;
}

export default function NotificationSettingsSection({
  initialValue = true,
}: NotificationSettingsSectionProps) {
  const { control, handleSubmit } = useForm<NotificationSettingsValues>({
    defaultValues: {
      receiveEmails: initialValue,
    },
  });

  function handleUpdate(values: NotificationSettingsValues) {
    // TODO: PATCH /organizations/:id
    // { receiveEmailNotifications: values.receiveEmails }

    console.log("PATCH notification settings", values);
  }

  return (
    <Card
      title="Notifications"
      subtitle="Choose how this organization is notified."
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
