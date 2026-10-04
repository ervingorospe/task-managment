import { signupSchema } from "./signup.schema";

const VALID = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@acmestudio.com",
  password: "password123",
  confirmPassword: "password123",
};

it("accepts a fully valid signup", () => {
  expect(signupSchema.safeParse(VALID).success).toBe(true);
});

it("rejects an empty first/last name", () => {
  expect(signupSchema.safeParse({ ...VALID, firstName: "" }).success).toBe(false);
  expect(signupSchema.safeParse({ ...VALID, lastName: "" }).success).toBe(false);
});

it("rejects an invalid email", () => {
  expect(signupSchema.safeParse({ ...VALID, email: "not-an-email" }).success).toBe(false);
});

it("rejects a password under 8 characters", () => {
  expect(signupSchema.safeParse({ ...VALID, password: "short", confirmPassword: "short" }).success).toBe(
    false,
  );
});

it("rejects mismatched passwords, flagging confirmPassword", () => {
  const result = signupSchema.safeParse({ ...VALID, confirmPassword: "different" });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
  }
});
