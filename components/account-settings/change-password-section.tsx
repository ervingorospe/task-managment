"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";

import Card from "@/components/ui/card";
import Input from "@/components/ui/form/input";
import { Button } from "@/components/ui/buttons/button";
import { useToast } from "@/providers/toast-provider";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/schemas/user.schema";

const defaultValues: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordSection() {
  const toast = useToast();

  const { control, handleSubmit, reset } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues,
  });

  function onSubmit(values: ChangePasswordValues) {
    // TODO: PATCH /users/me/password
    console.log("Change password payload", values);
    reset(defaultValues);
    toast("Password updated");
  }

  return (
    <Card
      title="Password"
      subtitle="Change the password you use to sign in."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          name="currentPassword"
          control={control}
          label="Current Password"
          type="password"
          icon={KeyRound}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            name="newPassword"
            control={control}
            label="New Password"
            type="password"
            icon={KeyRound}
          />
          <Input
            name="confirmPassword"
            control={control}
            label="Confirm New Password"
            type="password"
            icon={KeyRound}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Update password</Button>
        </div>
      </form>
    </Card>
  );
}
