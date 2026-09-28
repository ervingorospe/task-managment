import { z } from "zod";

export const rejectRequestSchema = z.object({
  remarks: z
    .string()
    .trim()
    .min(1, "Let the client know why this request is being rejected.")
    .max(1000),
});

export type RejectRequestValues = z.infer<typeof rejectRequestSchema>;
