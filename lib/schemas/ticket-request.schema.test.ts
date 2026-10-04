import { ticketRequestFormSchema } from "./ticket-request.schema";

const VALID = { title: "Fix the login page", description: "", attachments: [] };

it("accepts a minimal valid request", () => {
  expect(ticketRequestFormSchema.safeParse(VALID).success).toBe(true);
});

it("rejects a title shorter than 2 characters", () => {
  expect(ticketRequestFormSchema.safeParse({ ...VALID, title: "A" }).success).toBe(false);
});

it("rejects more than 5 attachments", () => {
  const files = Array.from({ length: 6 }, (_, i) => new File(["x"], `file-${i}.txt`));
  expect(
    ticketRequestFormSchema.safeParse({ ...VALID, attachments: files }).success,
  ).toBe(false);
});

it("rejects a file over 50MB", () => {
  const bigFile = new File([new Uint8Array(51 * 1024 * 1024)], "big.bin");
  expect(
    ticketRequestFormSchema.safeParse({ ...VALID, attachments: [bigFile] }).success,
  ).toBe(false);
});
