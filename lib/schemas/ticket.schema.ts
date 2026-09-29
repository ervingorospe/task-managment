import { z } from "zod";
import { localToday } from "@/lib/helper/ticket-status";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 5;

export const ticketFormSchema = z.object({
  organizationId: z.string().min(1, "Select an organization"),

  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150),

  description: z.string().trim().max(10000).optional().or(z.literal("")),

  assigneeIds: z.array(z.number()),

  clientId: z.string().nullable(),

  projectId: z.string().nullable(),

  dueDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((date) => !date || date >= localToday(), {
      message: "Due date can't be in the past",
    }),

  attachments: z
    .array(z.instanceof(File))
    .max(MAX_FILES, `You can attach up to ${MAX_FILES} files`)
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      "Each file must be 50MB or smaller",
    ),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;

/** Same shape as ticketFormSchema, minus organization/assignees/client
 * (no org to select or members to assign) and attachments (the org form's
 * attachments field isn't actually uploaded on create either — see
 * tickets-page-client.tsx's handleCreate — attaching happens after, from
 * the ticket detail page, so there's no existing behavior to match here). */
export const personalTicketFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150),

  description: z.string().trim().max(10000).optional().or(z.literal("")),

  tagId: z.string().min(1, "Select a status"),

  dueDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((date) => !date || date >= localToday(), {
      message: "Due date can't be in the past",
    }),
});

export type PersonalTicketFormValues = z.infer<typeof personalTicketFormSchema>;
