"use client";

import { useForm } from "react-hook-form";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import Select from "@/components/ui/form/select";
import { ChevronDown } from "lucide-react";

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
  initialExpiration?: string;
}

interface InviteSettingsValues {
  expiration: string;
}

export default function InviteSettingsSection({
  initialExpiration = "1_day",
}: InviteSettingsSectionProps) {
  const { control, handleSubmit } = useForm<InviteSettingsValues>({
    defaultValues: {
      expiration: initialExpiration,
    },
  });

  function handleUpdate(values: InviteSettingsValues) {
    // TODO: PATCH /organizations/:id
    // { inviteExpiration: values.expiration }

    console.log("PATCH invite settings", {
      inviteExpiration: values.expiration,
    });
  }

  return (
    <Card
      title="Invites"
      subtitle="Control how long sent invitations remain valid."
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
