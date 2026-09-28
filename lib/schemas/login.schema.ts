import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255),
  password: z.string().min(1, "Password is required").max(72),
});

export type LoginValues = z.infer<typeof loginSchema>;
