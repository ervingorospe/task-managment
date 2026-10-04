import { acceptInviteSchema } from "./accept-invite.schema";

const VALID = {
  firstName: "Alex",
  lastName: "Reyes",
  password: "password123",
  confirmPassword: "password123",
};

it("accepts a fully valid invite acceptance", () => {
  expect(acceptInviteSchema.safeParse(VALID).success).toBe(true);
});

it("rejects an empty first/last name", () => {
  expect(acceptInviteSchema.safeParse({ ...VALID, firstName: "" }).success).toBe(false);
  expect(acceptInviteSchema.safeParse({ ...VALID, lastName: "" }).success).toBe(false);
});

it("rejects a password under 8 characters", () => {
  expect(
    acceptInviteSchema.safeParse({ ...VALID, password: "short", confirmPassword: "short" })
      .success,
  ).toBe(false);
});

it("rejects mismatched passwords, flagging confirmPassword", () => {
  const result = acceptInviteSchema.safeParse({ ...VALID, confirmPassword: "different" });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
  }
});
