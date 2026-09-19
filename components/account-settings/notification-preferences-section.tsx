"use client";

import { useForm } from "react-hook-form";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/buttons/button";
import Checkbox from "@/components/ui/form/checkbox";
import { useToast } from "@/providers/toast-provider";

interface NotificationPreferencesValues {
  ticketUpdates: boolean;
  requestUpdates: boolean;
  productAnnouncements: boolean;
}

const defaultValues: NotificationPreferencesValues = {
  ticketUpdates: true,
  requestUpdates: true,
  productAnnouncements: false,
};

export default function NotificationPreferencesSection() {
  const toast = useToast();
  const { control, handleSubmit } = useForm<NotificationPreferencesValues>({
    defaultValues,
  });

  function onSubmit(values: NotificationPreferencesValues) {
    // TODO: PATCH /users/me/notification-preferences
    console.log("Notification preferences payload", values);
    toast("Notification preferences updated");
  }

  return (
    <Card
      title="Notifications"
      subtitle="Choose what you get emailed about."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Checkbox
          name="ticketUpdates"
          control={control}
          label="Ticket updates"
          description="Status changes and comments on tickets you're involved in."
        />
        <Checkbox
          name="requestUpdates"
          control={control}
          label="Request updates"
          description="When a request you submitted is approved or rejected."
        />
        <Checkbox
          name="productAnnouncements"
          control={control}
          label="Product announcements"
          description="Occasional news about new features."
        />

        <div className="flex justify-end">
          <Button type="submit" variant="secondary">
            Save preferences
          </Button>
        </div>
      </form>
    </Card>
  );
}
