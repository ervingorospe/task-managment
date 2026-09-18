"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/form/input";
import Select from "@/components/ui/form/select";
import {
  FileAttachmentInput,
  MarkdownEditor,
  MultiSelectDropdown,
} from "@/components/ui/form";
import {
  ticketFormSchema,
  type TicketFormValues,
} from "@/lib/schemas/ticket.schema";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import { ChevronDown } from "lucide-react";

interface TicketFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TicketFormValues) => void;
  organizations: OrganizationDetail[];
  currentOrganizationId: number;
}

function emptyDefaults(organizationId: number): TicketFormValues {
  return {
    organizationId: String(organizationId),
    title: "",
    description: "",
    assigneeIds: [],
    clientId: null,
    dueDate: "",
    attachments: [],
  };
}

export default function TicketFormModal({
  open,
  onClose,
  onSubmit,
  organizations,
  currentOrganizationId,
}: TicketFormModalProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: emptyDefaults(currentOrganizationId),
  });

  const selectedOrgId = watch("organizationId");
  const selectedOrg = organizations.find((o) => String(o.id) === selectedOrgId);
  const members = selectedOrg?.members ?? [];

  // Assignees: anyone who isn't a Client — clients are the requester
  // (see clientId below), not someone tickets get assigned to.
  const assignableMembers = members.filter(
    (m) => m.role?.roleName !== "Client",
  );
  const clientMembers = members.filter((m) => m.role?.roleName === "Client");

  // Selections from the previous org don't carry over — a member valid
  // in Org A isn't necessarily a member of Org B at all.
  useEffect(() => {
    setValue("assigneeIds", []);
    setValue("clientId", null);
  }, [selectedOrgId, setValue]);

  function submit(values: TicketFormValues) {
    onSubmit(values);
    reset(emptyDefaults(currentOrganizationId));
    onClose();
  }

  function handleClose() {
    reset(emptyDefaults(currentOrganizationId));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create ticket"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)}>Create ticket</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Select
          name="organizationId"
          control={control}
          label="Organization"
          icon={ChevronDown}
          iconPosition="right"
          options={organizations.map((o) => ({
            value: String(o.id),
            label: o.organizationName,
          }))}
        />

        <Input
          name="title"
          control={control}
          label="Title"
          placeholder="e.g. Checkout button not responding"
        />

        <MarkdownEditor
          name="description"
          control={control}
          label="Description"
          optional
          placeholder="What's going on? Supports markdown formatting."
        />

        <FileAttachmentInput name="attachments" control={control} />

        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-ink">
            Assign to <span className="ml-1 text-ink-faint">(optional)</span>
          </label>

          <Controller
            name="assigneeIds"
            control={control}
            render={({ field }) => (
              <MultiSelectDropdown
                isWidthFull={true}
                value={field.value}
                onChange={field.onChange}
                options={assignableMembers.map((m) => ({
                  value: m.id,
                  label: `${m.user?.firstName ?? ""} ${
                    m.user?.lastName ?? ""
                  }`.trim(),
                }))}
                placeholder="No one assigned"
                emptyMessage="No assignable members"
              />
            )}
          />
        </div>

        <Select
          name="clientId"
          control={control}
          label="Client"
          optional
          options={[
            { value: "", label: "No client" },
            ...clientMembers.map((m) => ({
              value: String(m.id),
              label: `${m.user?.firstName} ${m.user?.lastName}`,
            })),
          ]}
        />

        <div className="w-full">
          <Input
            name="dueDate"
            control={control}
            type="date"
            label="Due date"
            optional
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </form>
    </Modal>
  );
}
