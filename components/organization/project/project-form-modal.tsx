"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/form/input";
import Select from "@/components/ui/form/select";
import { MarkdownEditor, MultiSelectDropdown } from "@/components/ui/form";

import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/schemas/organization.schema";

import type { ProjectDetail } from "@/lib/types/organization/project-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => string | undefined;
  /** Pass an existing project to edit it; omit to create a new one. */
  project?: ProjectDetail;
  /** Members holding the Client role — offered as the project's client. */
  clientMembers: MemberDetail[];
  /** Members who can be staffed on a project (i.e. not Clients) — offered
   * as assignees. */
  assignableMembers: MemberDetail[];
}

const emptyDefaults: ProjectFormValues = {
  name: "",
  description: "",
  clientId: null,
  assigneeIds: [],
};

export function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  project,
  clientMembers,
  assignableMembers,
}: ProjectFormModalProps) {
  const isEditMode = Boolean(project);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      project
        ? {
            name: project.name,
            description: project.description ?? "",
            clientId: project.clientId ? String(project.clientId) : null,
            assigneeIds: project.assignees.map((m) => m.id),
          }
        : emptyDefaults,
    );
  }, [open, project, reset]);

  function submit(values: ProjectFormValues) {
    const error = onSubmit(values);

    if (error) {
      setError("name", { type: "duplicate", message: error });
      return;
    }

    reset(emptyDefaults);
  }

  function handleClose() {
    reset(emptyDefaults);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit project" : "Add project"}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>

          <Button onClick={handleSubmit(submit)}>
            {isEditMode ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(submit)}>
        {errors.name?.type === "duplicate" && (
          <div className="rounded border border-danger bg-danger-subtle px-3 py-2">
            <p className="text-sm text-danger">{errors.name.message}</p>
          </div>
        )}

        <Input
          name="name"
          control={control}
          label="Project name"
          placeholder="e.g. Website Revamp"
          maxLength={50}
        />

        <MarkdownEditor
          name="description"
          control={control}
          label="Description"
          optional
          placeholder="What is this project for? Supports markdown formatting."
        />

        <Select
          name="clientId"
          control={control}
          label="Client"
          optional
          options={[
            { value: "", label: "No client" },
            ...clientMembers.map((m) => ({
              value: String(m.id),
              label: `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim(),
            })),
          ]}
        />

        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-ink">
            Assignees <span className="ml-1 text-ink-faint">(optional)</span>
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
      </form>
    </Modal>
  );
}
