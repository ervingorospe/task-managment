"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/form/input";
import Textarea from "@/components/ui/form/textarea";
import PropertyRow from "@/components/ui/property-row";

import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";

import {
  roleFormSchema,
  type RoleFormValues,
} from "@/lib/schemas/organization.schema";

import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { CheckboxBase } from "@/components/ui/form";

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => string | undefined;
  /** Pass an existing role to edit it; omit to create a new one. */
  role?: RoleDetail;
}

const emptyDefaults: RoleFormValues = {
  roleName: "",
  roleDesc: "",
  rules: [],
};

export function RoleFormModal({
  open,
  onClose,
  onSubmit,
  role,
}: RoleFormModalProps) {
  const isEditMode = Boolean(role);
  const { permissionOptions: rules, ruleCategories: rulesCategories } =
    useOrganizationDefaults();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      role
        ? {
            roleName: role.roleName,
            roleDesc: role.roleDesc,
            rules: role.rules.map((rule) => rule.id),
          }
        : emptyDefaults,
    );
  }, [open, role, reset]);

  const selected = watch("rules");

  const allChecked = selected.length === rules.length;
  const someChecked = selected.length > 0 && !allChecked;

  function toggleAll() {
    setValue("rules", allChecked ? [] : rules.map((rule) => rule.id), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function togglePermission(id: number) {
    const next = selected.includes(id)
      ? selected.filter((permissionId) => permissionId !== id)
      : [...selected, id];

    setValue("rules", next, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function submit(values: RoleFormValues) {
    const error = onSubmit(values);

    if (error) {
      setError("roleName", {
        type: "duplicate",
        message: error,
      });

      return;
    }

    reset(emptyDefaults);
  }

  function handleClose() {
    reset(emptyDefaults);
    onClose();
  }

  const grouped = rules.reduce<Record<string, typeof rules>>((acc, rule) => {
    const category = rulesCategories.find(
      (category) => category.id === rule.categoryId,
    );

    const label = category?.name ?? "Other";

    (acc[label] ??= []).push(rule);

    return acc;
  }, {});

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit role" : "Add role"}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>

          <Button onClick={handleSubmit(submit)}>
            {isEditMode ? "Save changes" : "Create role"}
          </Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(submit)}>
        {errors.roleName?.type === "duplicate" && (
          <div className="rounded border border-danger bg-danger-subtle px-3 py-2">
            <p className="text-sm text-danger">{errors.roleName.message}</p>
          </div>
        )}

        <Input
          name="roleName"
          control={control}
          label="Role name"
          placeholder="e.g. Admin"
          maxLength={40}
        />

        <Textarea
          name="roleDesc"
          control={control}
          label="Description"
          optional
          rows={2}
          placeholder="What can this role do?"
          maxLength={200}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Permissions</label>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(element) => {
                  if (element) {
                    element.indeterminate = someChecked;
                  }
                }}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-line"
              />
              Select all
            </label>
          </div>

          {errors.rules && (
            <p className="mb-2 text-xs text-danger">{errors.rules.message}</p>
          )}

          <div className="max-h-72 space-y-4 overflow-y-auto rounded border border-line p-3">
            {Object.entries(grouped).map(([category, categoryRules]) => (
              <PropertyRow key={category} label={category}>
                <div className="space-y-1.5">
                  {categoryRules.map((rule) => (
                    <CheckboxBase
                      key={rule.id}
                      checked={selected.includes(rule.id)}
                      onChange={() => togglePermission(rule.id)}
                      label={rule.name}
                    />
                  ))}
                </div>
              </PropertyRow>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
