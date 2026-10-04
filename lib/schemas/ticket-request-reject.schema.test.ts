import { rejectRequestSchema } from "./ticket-request-reject.schema";

it("accepts non-empty remarks", () => {
  expect(rejectRequestSchema.safeParse({ remarks: "Not enough detail" }).success).toBe(
    true,
  );
});

it("rejects empty remarks", () => {
  expect(rejectRequestSchema.safeParse({ remarks: "" }).success).toBe(false);
});

it("rejects remarks over 1000 characters", () => {
  expect(rejectRequestSchema.safeParse({ remarks: "a".repeat(1001) }).success).toBe(
    false,
  );
});
