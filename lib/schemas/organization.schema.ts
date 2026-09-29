import { z } from "zod";

export const basicInfoSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(50),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(50)
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .trim()
    .url("Enter a valid URL, e.g. https://example.com")
    .max(50)
    .optional()
    .or(z.literal("")),
  organizationDesc: z.string().trim().max(300).optional().or(z.literal("")),
});
export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

export const settingsSchema = z.object({
  logo: z.string().optional().or(z.literal("")),
  timezone: z.string().min(1, "Select a timezone"),
});
export type SettingsValues = z.infer<typeof settingsSchema>;

export const invitesSchema = z.object({
  invites: z.array(
    z.object({
      id: z.number(),
      email: z.string().email().max(50),
      roleId: z.number(),
    }),
  ),
});

export const rolesSchema = z.object({
  roles: z.array(z.any()),
});

export const tagsSchema = z.object({
  tags: z.array(
    z.object({
      id: z.number(),
      tagName: z.string().max(50),
      color: z.string(),
      isDefault: z.boolean(),
    }),
  ),
});

export const roleFormSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(40),
  roleDesc: z.string().trim().max(200).optional().or(z.literal("")),
  rules: z.array(z.number()).min(1, "Select at least one permission"), // was z.array(z.string())
});
export type RoleFormValues = z.infer<typeof roleFormSchema>;

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(50),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
  clientId: z.string().nullable(),
  assigneeIds: z.array(z.number()),
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const changeOwnerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(50),
});
export type ChangeOwnerValues = z.infer<typeof changeOwnerSchema>;
