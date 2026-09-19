"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, X, Check } from "lucide-react";

import Card from "@/components/ui/card";
import Input from "@/components/ui/form/input";
import { Button } from "@/components/ui/buttons/button";
import { MetaBadge } from "@/components/ui/meta-badge";
import Avatar from "@/components/ui/avatar";
import AvatarUpload from "./avatar-upload";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { profileSchema, type ProfileValues } from "@/lib/schemas/user.schema";

export default function ProfileInfoSection() {
  const { currentUser, updateProfile } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentUser?.firstName ?? "",
      lastName: currentUser?.lastName ?? "",
      email: currentUser?.email ?? "",
      avatar: null,
    },
  });

  if (!currentUser) return null;

  function startEditing() {
    reset({
      firstName: currentUser!.firstName,
      lastName: currentUser!.lastName,
      email: currentUser!.email,
      avatar: null,
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  function onSave(values: ProfileValues) {
    const changedFields = Object.keys(dirtyFields) as Array<
      keyof ProfileValues
    >;

    if (changedFields.length === 0) {
      setIsEditing(false);
      return;
    }

    updateProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      avatar: values.avatar
        ? URL.createObjectURL(values.avatar)
        : currentUser!.avatar,
    });

    setIsEditing(false);
    toast("Profile updated");
  }

  return (
    <Card
      title="Profile"
      subtitle="Your personal information."
      headerActions={
        isEditing ? (
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
        ) : (
          <Button type="button" variant="secondary" onClick={startEditing}>
            <Pencil size={14} className="mr-1.5" />
            Edit
          </Button>
        )
      }
    >
      {isEditing ? (
        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          <AvatarUpload
            name="avatar"
            control={control}
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
            currentSrc={currentUser.avatar}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input name="firstName" control={control} label="First Name" />
            <Input name="lastName" control={control} label="Last Name" />
            <Input
              name="email"
              control={control}
              label="Email"
              type="email"
              className="sm:col-span-2"
            />
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-4">
          <Avatar
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
            src={currentUser.avatar ?? undefined}
            size="xl"
          />

          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-ink">
              {currentUser.firstName} {currentUser.lastName}
            </h3>
            <p className="mt-0.5 truncate text-sm text-ink-muted">
              {currentUser.email}
            </p>
            <div className="mt-1.5">
              <MetaBadge>
                {currentUser.accountType === "owner" ? "Owner" : "Member"}
              </MetaBadge>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
