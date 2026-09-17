import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 5;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const ticketFormSchema = z
  .object({
    organizationId: z.string().min(1, "Select an organization"),
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(150),

    description: z.string().trim().max(10000).optional().or(z.literal("")),

    assigneeIds: z.array(z.number()),

    clientId: z.string().nullable(),

    startDate: z.string().optional().or(z.literal("")),

    dueDate: z.string().optional().or(z.literal("")),

    attachments: z
      .array(z.instanceof(File))
      .max(MAX_FILES, `You can attach up to ${MAX_FILES} files`)
      .refine(
        (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
        "Each file must be 50MB or smaller",
      ),
  })
  .refine((data) => !data.startDate || data.startDate >= today(), {
    message: "Start date can't be in the past",
    path: ["startDate"],
  })
  .refine(
    (data) =>
      !data.startDate || !data.dueDate || data.dueDate >= data.startDate,
    {
      message: "Due date can't be earlier than the start date",
      path: ["dueDate"],
    },
  );

export type TicketFormValues = z.infer<typeof ticketFormSchema>;
