"use client";

import { useEffect, useRef } from "react";
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
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import { localToday } from "@/lib/helper/ticket-status";
import { ChevronDown, Paperclip } from "lucide-react";

interface TicketFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TicketFormValues) => void;
  organizations: OrganizationDetail[];
  currentOrganizationId: number;
  /** Pre-fills the form — used when creating a ticket from an approved request. */
  initialValues?: Partial<TicketFormValues>;
  /** Already-uploaded files carried over from a request — shown read-only, and merged into the ticket's attachments on submit. */
  existingAttachments?: TicketAttachment[];
  title?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function emptyDefaults(
  organizationId: number,
  initialValues?: Partial<TicketFormValues>,
): TicketFormValues {
  return {
    organizationId: String(organizationId),
    title: "",
    description: "",
    assigneeIds: [],
    clientId: null,
    dueDate: "",
    attachments: [],
    ...initialValues,
  };
}

export default function TicketFormModal({
  open,
  onClose,
  onSubmit,
  organizations,
  currentOrganizationId,
  initialValues,
  existingAttachments = [],
  title = "Create ticket",
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
    defaultValues: emptyDefaults(currentOrganizationId, initialValues),
  });

  // The modal instance is reused across opens — re-seed the form each time
  // it opens (e.g. approving a different request needs its own prefill).
  useEffect(() => {
    if (open) {
      reset(emptyDefaults(currentOrganizationId, initialValues));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedOrgId = watch("organizationId");
  const selectedOrg = organizations.find((o) => String(o.id) === selectedOrgId);
  const members = selectedOrg?.members ?? [];

  // Members don't always come back with `role` resolved (some mock records
  // only carry `roleId`) — fall back to matching against the org's own
  // "Client" role id so this doesn't silently misclassify clients as
  // assignable members (or vice versa) when that's the case.
  const clientRoleId = selectedOrg?.roles.find(
    (r) => r.roleName === "Client",
  )?.id;
  const isClient = (m: (typeof members)[number]) =>
    m.role?.roleName === "Client" || m.roleId === clientRoleId;

  // Assignees: anyone who isn't a Client — clients are the requester
  // (see clientId below), not someone tickets get assigned to.
  const assignableMembers = members.filter((m) => !isClient(m));
  const clientMembers = members.filter(isClient);

  // Selections from the previous org don't carry over — a member valid
  // in Org A isn't necessarily a member of Org B at all. Guarded against
  // the initial org id so this doesn't also wipe out a prefill (e.g.
  // approving a request) the moment the modal mounts.
  const lastOrgId = useRef(selectedOrgId);
  useEffect(() => {
    if (selectedOrgId === lastOrgId.current) return;
    lastOrgId.current = selectedOrgId;
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
      title={title}
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
          maxLength={150}
        />

        <MarkdownEditor
          name="description"
          control={control}
          label="Description"
          optional
          placeholder="What's going on? Supports markdown formatting."
        />

        {existingAttachments.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Attached with the request
            </label>
            <ul className="space-y-1">
              {existingAttachments.map((file) => (
                <li key={file.id}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink hover:text-accent-text"
                  >
                    <Paperclip size={12} className="shrink-0 text-ink-faint" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-ink-faint">
                      ({formatSize(file.size)})
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <FileAttachmentInput
          name="attachments"
          control={control}
          label={
            existingAttachments.length > 0
              ? "Add more attachments"
              : "Attachments"
          }
        />

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
            min={localToday()}
          />
        </div>
      </form>
    </Modal>
  );
}
