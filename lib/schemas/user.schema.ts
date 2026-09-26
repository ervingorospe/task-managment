import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Enter a valid email address"),
  avatar: z.instanceof(File).nullable(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

// currentPassword is required only when the account already has one — an
// OAuth-only account (see ChangePasswordSection) is setting its first
// password, not changing an existing one.
export function makeChangePasswordSchema(hasPassword: boolean) {
  return z
    .object({
      currentPassword: hasPassword
        ? z.string().min(1, "Enter your current password")
        : z.string().optional(),
      newPassword: z
        .string()
        .min(8, "Must be at least 8 characters")
        .max(72),
      confirmPassword: z.string().min(1, "Confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
}
export type ChangePasswordValues = z.infer<
  ReturnType<typeof makeChangePasswordSchema>
>;
