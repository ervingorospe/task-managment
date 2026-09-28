"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";

import Card from "@/components/ui/card";
import Input from "@/components/ui/form/input";
import { Button } from "@/components/ui/buttons/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useAuth } from "@/providers/auth-provider";
import { changeUserPassword } from "@/lib/api/users";
import { apiErrorMessage } from "@/lib/helper/api-error-toast";
import {
  makeChangePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/schemas/user.schema";

const defaultValues: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordSection() {
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const { currentUser } = useAuth();
  const hasPassword = currentUser?.hasPassword ?? true;

  const schema = useMemo(() => makeChangePasswordSchema(hasPassword), [hasPassword]);
  const { control, handleSubmit, reset } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: ChangePasswordValues) {
    if (!currentUser) return;
    try {
      await changeUserPassword(currentUser.id, {
        currentPassword: hasPassword ? values.currentPassword : undefined,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      reset(defaultValues);
      showAlert(hasPassword ? "Password updated" : "Password set", "success");
    } catch (error) {
      showAlert(
        apiErrorMessage(error, "Failed to update password"),
        "error",
      );
    }
  }

  return (
    <Card
      title="Password"
      subtitle={
        hasPassword
          ? "Change the password you use to sign in."
          : "Your account signed in with Google and has no password yet — set one to also sign in with email and password."
      }
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {hasPassword && (
          <Input
            name="currentPassword"
            control={control}
            label="Current Password"
            type="password"
            icon={KeyRound}
          />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            name="newPassword"
            control={control}
            label="New Password"
            type="password"
            icon={KeyRound}
            maxLength={72}
          />
          <Input
            name="confirmPassword"
            control={control}
            label="Confirm New Password"
            type="password"
            icon={KeyRound}
            maxLength={72}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            {hasPassword ? "Update password" : "Set password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
