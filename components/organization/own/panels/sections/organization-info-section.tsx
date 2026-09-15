"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { ChevronDown, RefreshCcw } from "lucide-react";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Select from "@/components/ui/form/select";

import { getTimezoneList } from "@/lib/helper/timezones";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

const ChangeOwnerModal = lazyNamed(
  () => import("@/components/organization/own/change-owner-modal"),
  "ChangeOwnerModal",
);

interface OrganizationInfoSectionProps {
  organization: OrganizationDetail;
}

interface TimezoneFormValues {
  timezone: string;
}

export default function OrganizationInfoSection({
  organization,
}: OrganizationInfoSectionProps) {
  const timezones = useMemo(getTimezoneList, []);

  const [logo, setLogo] = useState(organization.settings.logo);
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [cancelTransferModalOpen, setCancelTransferModalOpen] = useState(false);

  const [pendingTransfer, setPendingTransfer] = useState(
    organization.pendingOwnershipTransfer ?? null,
  );

  const ownerName = `${organization.owner.firstName} ${organization.owner.lastName}`;

  const { control, handleSubmit, reset } = useForm<TimezoneFormValues>({
    defaultValues: {
      timezone: organization.settings.timezone,
    },
  });

  const timezoneOptions = useMemo(
    () =>
      timezones.map((timezone) => ({
        value: timezone,
        label: timezone,
      })),
    [timezones],
  );

  useEffect(() => {
    return () => {
      if (logo?.startsWith("blob:")) {
        URL.revokeObjectURL(logo);
      }
    };
  }, [logo]);

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setLogo((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return url;
    });

    // TODO: upload the file and PATCH /organizations/:id { logo }
  }

  function handleTimezoneEdit() {
    setIsEditingTimezone(true);
  }

  function handleTimezoneCancel() {
    reset({
      timezone: organization.settings.timezone,
    });

    setIsEditingTimezone(false);
  }

  function handleTimezoneSave(values: TimezoneFormValues) {
    // TODO: PATCH /organizations/:id { timezone: values.timezone }

    console.log("PATCH timezone", values.timezone);

    setIsEditingTimezone(false);
  }

  function handleOwnershipTransferSent(email: string) {
    setPendingTransfer({
      id: Date.now(),
      email,
      createdAt: new Date().toISOString(),
      roleId: 1,
    });
  }

  function handleCancelTransfer() {
    if (!pendingTransfer) return;

    // TODO: DELETE /organizations/:id/ownership-transfer

    setPendingTransfer(null);
    setCancelTransferModalOpen(false);
  }

  return (
    <Card title="Information" subtitle="Basic settings for your organization.">
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border border-line bg-canvas">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt="Organization logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <Avatar firstName={organization.organizationName} size="lg" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-ink">Logo</p>

            <label className="mt-1 inline-block cursor-pointer rounded border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas">
              Change Logo
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Timezone */}
        <form
          onSubmit={handleSubmit(handleTimezoneSave)}
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <Select
              icon={ChevronDown}
              iconPosition="right"
              name="timezone"
              control={control}
              label="Timezone"
              options={timezoneOptions}
              disabled={!isEditingTimezone}
            />
          </div>

          {isEditingTimezone ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleTimezoneCancel}
              >
                Cancel
              </Button>

              <Button type="submit">Save</Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={handleTimezoneEdit}
            >
              Update
            </Button>
          )}
        </form>

        {/* Owner */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Owner</p>

              <p className="mt-0.5 text-sm text-ink-muted">
                {ownerName} · {organization.owner.email}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => setOwnerModalOpen(true)}
              disabled={!!pendingTransfer}
            >
              <RefreshCcw size={14} className="mr-1.5" />
              Change
            </Button>
          </div>

          {/* Pending Ownership Transfer */}
          {pendingTransfer && (
            <div className="mt-2 flex items-center justify-between gap-4 rounded border border-line bg-canvas px-3 py-2">
              <p className="text-xs text-ink-muted">
                An ownership transfer to{" "}
                <span className="font-medium text-ink">
                  {pendingTransfer.email}
                </span>{" "}
                was sent and is waiting to be accepted.
              </p>

              <button
                type="button"
                onClick={() => setCancelTransferModalOpen(true)}
                className="shrink-0 text-xs font-medium text-danger hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Owner Modal */}
      {ownerModalOpen && (
        <ChangeOwnerModal
          open={ownerModalOpen}
          onClose={() => setOwnerModalOpen(false)}
          onSent={handleOwnershipTransferSent}
        />
      )}

      {/* Cancel Ownership Transfer Confirmation */}
      {pendingTransfer && (
        <ConfirmDialog
          open={cancelTransferModalOpen}
          onClose={() => setCancelTransferModalOpen(false)}
          onConfirm={handleCancelTransfer}
          title="Cancel ownership transfer?"
          description={`Are you sure you want to cancel the ownership transfer to ${pendingTransfer.email}? They will no longer be able to accept this invitation.`}
          confirmLabel="Cancel transfer"
          danger
        />
      )}
    </Card>
  );
}
