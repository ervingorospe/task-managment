import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 5;

export const ticketRequestFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150),

  description: z.string().trim().max(10000).optional().or(z.literal("")),

  attachments: z
    .array(z.instanceof(File))
    .max(MAX_FILES, `You can attach up to ${MAX_FILES} files`)
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      "Each file must be 50MB or smaller",
    ),
});

export type TicketRequestFormValues = z.infer<typeof ticketRequestFormSchema>;
