import { contactSchema } from "./contact.schema";

const VALID = {
  name: "Jane Doe",
  email: "jane@acmestudio.com",
  message: "Hi, I'd like a walkthrough of Relay for my team.",
};

it("accepts a fully valid submission", () => {
  expect(contactSchema.safeParse(VALID).success).toBe(true);
});

it("rejects an empty name", () => {
  expect(contactSchema.safeParse({ ...VALID, name: "" }).success).toBe(false);
});

it("rejects an invalid email", () => {
  expect(
    contactSchema.safeParse({ ...VALID, email: "not-an-email" }).success,
  ).toBe(false);
});

it("rejects a message under 10 characters", () => {
  expect(
    contactSchema.safeParse({ ...VALID, message: "too short" }).success,
  ).toBe(false);
});

it("trims surrounding whitespace", () => {
  const result = contactSchema.safeParse({
    ...VALID,
    name: "  Jane Doe  ",
  });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.name).toBe("Jane Doe");
  }
});
