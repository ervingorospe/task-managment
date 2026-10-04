import { loginSchema } from "./login.schema";

it("accepts a valid email/password", () => {
  expect(loginSchema.safeParse({ email: "jane@acmestudio.com", password: "123" }).success).toBe(
    true,
  );
});

it("rejects an invalid email", () => {
  expect(loginSchema.safeParse({ email: "not-an-email", password: "123" }).success).toBe(
    false,
  );
});

it("rejects an empty email", () => {
  expect(loginSchema.safeParse({ email: "", password: "123" }).success).toBe(false);
});

it("rejects an empty password", () => {
  expect(
    loginSchema.safeParse({ email: "jane@acmestudio.com", password: "" }).success,
  ).toBe(false);
});
