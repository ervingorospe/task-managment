import { ticketFormSchema, personalTicketFormSchema } from "./ticket.schema";

const VALID_TICKET = {
  organizationId: "6001",
  title: "Fix the login button",
  description: "",
  assigneeIds: [],
  clientId: null,
  projectId: null,
  dueDate: "",
  attachments: [],
};

describe("ticketFormSchema", () => {
  it("accepts a minimal valid ticket", () => {
    expect(ticketFormSchema.safeParse(VALID_TICKET).success).toBe(true);
  });

  it("rejects a title shorter than 2 characters", () => {
    const result = ticketFormSchema.safeParse({ ...VALID_TICKET, title: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty organizationId", () => {
    const result = ticketFormSchema.safeParse({
      ...VALID_TICKET,
      organizationId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a due date in the past", () => {
    const result = ticketFormSchema.safeParse({
      ...VALID_TICKET,
      dueDate: "2000-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts today as a due date", () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = ticketFormSchema.safeParse({
      ...VALID_TICKET,
      dueDate: today,
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 5 attachments", () => {
    const files = Array.from(
      { length: 6 },
      (_, i) => new File(["x"], `file-${i}.txt`),
    );
    const result = ticketFormSchema.safeParse({
      ...VALID_TICKET,
      attachments: files,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file over 50MB", () => {
    const bigFile = new File([new Uint8Array(51 * 1024 * 1024)], "big.bin");
    const result = ticketFormSchema.safeParse({
      ...VALID_TICKET,
      attachments: [bigFile],
    });
    expect(result.success).toBe(false);
  });
});

describe("personalTicketFormSchema", () => {
  const VALID_PERSONAL_TICKET = {
    title: "Buy groceries",
    description: "",
    tagId: "3",
    dueDate: "",
  };

  it("accepts a minimal valid personal ticket", () => {
    expect(
      personalTicketFormSchema.safeParse(VALID_PERSONAL_TICKET).success,
    ).toBe(true);
  });

  it("rejects a due date in the past", () => {
    const result = personalTicketFormSchema.safeParse({
      ...VALID_PERSONAL_TICKET,
      dueDate: "2000-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts today as a due date", () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = personalTicketFormSchema.safeParse({
      ...VALID_PERSONAL_TICKET,
      dueDate: today,
    });
    expect(result.success).toBe(true);
  });

  it("requires a tagId to be selected", () => {
    const result = personalTicketFormSchema.safeParse({
      ...VALID_PERSONAL_TICKET,
      tagId: "",
    });
    expect(result.success).toBe(false);
  });
});
